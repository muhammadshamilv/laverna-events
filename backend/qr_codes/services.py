import io
import json
import logging

import qrcode
from django.conf import settings
from django.shortcuts import get_object_or_404
from events.models import Event
from gallery.models import GalleryMedia
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from .models import EventQRCode, GuestSelfieSession

logger = logging.getLogger(__name__)

# How close two face encodings must be to count as the same person.
# face_recognition's own docs recommend 0.6 as a reasonable default
# threshold (lower = stricter/fewer false positives, higher = looser/more
# false positives). Kept as a module constant rather than hardcoded
# inline so it's the one obvious place to tune if organizers report too
# many/too few matches once this is used with real event photos.
FACE_MATCH_TOLERANCE = 0.6


class QRCodeError(Exception):
    """Raised when a QR code action cannot be completed."""

    def __init__(self, message: str, code: str = "qr_code_error"):
        self.message = message
        self.code = code
        super().__init__(message)


def get_or_create_event_qr_code(event: Event) -> EventQRCode:
    """Every event gets exactly one QR code, created lazily the first
    time it's needed (viewing the QR page, or downloading PNG/PDF)
    rather than at event-creation time, so this app stays fully
    decoupled from events/services.py - no signal or hook was added
    there for this."""

    qr_code, _ = EventQRCode.objects.get_or_create(event=event)
    return qr_code


def build_scan_url(qr_code: EventQRCode) -> str:
    """The URL embedded in the QR image - what a guest's phone camera
    actually opens. Points at the FRONTEND's public scan route (not an
    API endpoint), since that route is what renders the camera/selfie
    UI. FRONTEND_BASE_URL is read from settings/env so this works
    correctly in both local dev and production without a code change.
    """

    base = str(settings.FRONTEND_BASE_URL).rstrip("/")
    return f"{base}/scan/{qr_code.token}"


def generate_qr_png_bytes(qr_code: EventQRCode) -> bytes:
    """Renders the QR code as PNG bytes, ready to return as a file
    response or embed in a PDF."""

    url = build_scan_url(qr_code)

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    image = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def generate_qr_pdf_bytes(qr_code: EventQRCode) -> bytes:
    """Builds a simple, print-ready A4 PDF: event name, the QR image
    centered, and a short instruction line - designed to be printed and
    physically placed at the venue, per the product requirement.

    Deliberately built with plain reportlab drawing calls rather than an
    HTML-to-PDF template, since this is a single fixed layout (not a
    multi-item document like an invitation), so a template would add
    complexity without adding flexibility that's actually needed here.
    """

    event = qr_code.event
    png_bytes = generate_qr_png_bytes(qr_code)
    png_buffer = io.BytesIO(png_bytes)

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    page_width, page_height = A4

    pdf.setFont("Helvetica-Bold", 22)
    pdf.drawCentredString(page_width / 2, page_height - 60 * mm, "Scan to view & download your photos")

    pdf.setFont("Helvetica", 14)
    pdf.drawCentredString(page_width / 2, page_height - 70 * mm, event.name)

    qr_size = 90 * mm
    qr_x = (page_width - qr_size) / 2
    qr_y = page_height - 70 * mm - qr_size - 20 * mm
    pdf.drawImage(
        ImageReader(png_buffer),
        qr_x,
        qr_y,
        width=qr_size,
        height=qr_size,
    )

    pdf.setFont("Helvetica", 11)
    pdf.drawCentredString(
        page_width / 2,
        qr_y - 15 * mm,
        "Take a selfie after scanning to find and download every photo you're in.",
    )

    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(page_width / 2, 20 * mm, "Powered by LavernaEvents")

    pdf.showPage()
    pdf.save()

    return buffer.getvalue()


def resolve_active_qr_code(token) -> EventQRCode:
    """Looks up an EventQRCode by its public token for the guest-facing
    scan flow. 404s (via get_object_or_404) rather than raising
    QRCodeError for an unknown token, matching how every other
    get_object_or_404-based lookup in this project's views behaves for a
    not-found public resource. A deactivated code (is_active=False) is
    treated the same as not-found - the organizer's ability to pull a QR
    code out of service (event postponed/cancelled) should give a guest
    no signal that a code ever existed at that URL.
    """

    return get_object_or_404(EventQRCode, token=token, is_active=True)


def match_selfie_to_gallery(event: Event, selfie_file) -> tuple[list[GalleryMedia], GuestSelfieSession]:
    """The core Phase 13 guest-facing operation: given one selfie photo,
    find every gallery photo in `event` that contains the same face.

    Pipeline:
      1. Detect the face(s) in the guest's selfie and take the first
         one found (a selfie is expected to contain exactly one person;
         if several faces are accidentally captured, only the primary/
         first-detected one is used as the query - good enough for the
         intended one-person-selfie use case without adding a
         disambiguation UI step).
      2. Load every already-computed FaceEmbedding for this event's
         gallery (pre-computed at upload time - see
         gallery.services.scan_media_for_faces - so this step is just a
         database read, not a live re-scan of every photo).
      3. Compare the selfie's encoding against each stored encoding with
         face_recognition.compare_faces/face_distance, keeping the
         distinct GalleryMedia items with at least one matching face.
      4. Record a GuestSelfieSession (analytics only - see that model's
         docstring for why it holds no guest identity).

    The selfie image itself is never saved to disk/storage - it is read
    into memory (`face_recognition.load_image_file` accepts a file-like
    object) purely to compute its encoding, then discarded once this
    function returns. Keeping a stranger's biometric photo with no
    account or consent attached would be a real privacy liability with
    no corresponding product benefit, since only the encoding (a list of
    floats, not reversible back into a photo) is ever needed again.
    """

    import face_recognition

    selfie_image = face_recognition.load_image_file(selfie_file)
    selfie_encodings = face_recognition.face_encodings(selfie_image)

    if not selfie_encodings:
        raise QRCodeError(
            "No face was detected in that photo. Please retake your selfie in good lighting, facing the camera.",
            code="no_face_detected",
        )

    selfie_encoding = selfie_encodings[0]

    matched_media_ids = _find_matching_media_ids(event, selfie_encoding)

    matched_media = list(
        GalleryMedia.objects.filter(id__in=matched_media_ids).order_by("-is_featured", "-created_at")
    )

    session = GuestSelfieSession.objects.create(event=event, match_count=len(matched_media))
    if matched_media:
        session.matched_media.set(matched_media)

    return matched_media, session


def _find_matching_media_ids(event: Event, selfie_encoding) -> set[int]:
    """Compares one selfie encoding against every stored FaceEmbedding
    for this event's gallery, returning the set of GalleryMedia ids with
    at least one matching face.

    gallery.models is imported lazily here (rather than at module load
    time) purely to keep face_recognition's own lazy-import convention
    consistent throughout this module - not because of any actual
    circular-import risk, since qr_codes already depends on gallery
    (GalleryMedia is imported at the top of this file) and gallery has
    no reverse dependency on qr_codes.
    """

    import face_recognition
    import numpy as np

    from gallery.models import FaceEmbedding

    rows = FaceEmbedding.objects.filter(media__event=event).values("media_id", "encoding_json")

    matched_media_ids: set[int] = set()
    known_encodings: list = []
    known_media_ids: list[int] = []

    for row in rows:
        known_encodings.append(np.array(json.loads(row["encoding_json"])))
        known_media_ids.append(row["media_id"])

    if not known_encodings:
        return matched_media_ids

    distances = face_recognition.face_distance(known_encodings, selfie_encoding)

    for media_id, distance in zip(known_media_ids, distances):
        if distance <= FACE_MATCH_TOLERANCE:
            matched_media_ids.add(media_id)

    return matched_media_ids
