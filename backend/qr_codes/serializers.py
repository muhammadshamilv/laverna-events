from gallery.serializers import GalleryMediaSerializer
from rest_framework import serializers

from .models import EventQRCode
from .services import build_scan_url


class EventQRCodeSerializer(serializers.Serializer):
    """Organizer-facing: what the QR management page needs to render
    itself and build the download links. Every field is a
    SerializerMethodField (rather than a plain field reading a model
    attribute directly) because none of token/scan_url/is_active/the
    download URLs are simple 1:1 model attributes here - scan_url and
    the download URLs are always derived (built from the request and the
    event id), and keeping all four derivations in one place/style avoids
    a view having to hand-merge partial dicts into the serialized output.
    """

    token = serializers.SerializerMethodField()
    scan_url = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    png_download_url = serializers.SerializerMethodField()
    pdf_download_url = serializers.SerializerMethodField()

    def get_token(self, qr_code: EventQRCode) -> str:
        return str(qr_code.token)

    def get_scan_url(self, qr_code: EventQRCode) -> str:
        return build_scan_url(qr_code)

    def get_is_active(self, qr_code: EventQRCode) -> bool:
        return qr_code.is_active

    def get_png_download_url(self, qr_code: EventQRCode) -> str:
        request = self.context["request"]
        return request.build_absolute_uri(f"/api/events/{qr_code.event_id}/qr-code/png/")

    def get_pdf_download_url(self, qr_code: EventQRCode) -> str:
        request = self.context["request"]
        return request.build_absolute_uri(f"/api/events/{qr_code.event_id}/qr-code/pdf/")


class ScannedEventSerializer(serializers.Serializer):
    """Public, guest-facing: the minimum event info shown on the scan
    landing page before the guest takes a selfie. Deliberately much
    smaller than the organizer's full EventSummarySerializer (from
    photographers/serializers.py) - a guest has no login and no access
    grant, so this must never leak organizer-only details (venue address,
    guest counts, budget, etc.), only what's needed to confirm "you're
    about to view photos from this event" and show a cover image.
    """

    id = serializers.IntegerField()
    name = serializers.CharField()
    event_date = serializers.DateField()
    cover_image = serializers.SerializerMethodField()

    def get_cover_image(self, event) -> str | None:
        request = self.context.get("request")
        if not event.cover_image:
            return None
        return request.build_absolute_uri(event.cover_image.url) if request else event.cover_image.url


class SelfieUploadSerializer(serializers.Serializer):
    """Validates the guest's selfie upload. Reuses the same image-only
    extension set gallery.serializers.IMAGE_EXTENSIONS defines, rather
    than a video-inclusive set, since a selfie can only ever be a still
    photo."""

    selfie = serializers.ImageField()


class SelfieMatchResultSerializer(serializers.Serializer):
    """The guest-facing response after a selfie is matched: how many
    photos matched, plus the photos themselves (reusing
    GalleryMediaSerializer so the guest sees the exact same file/
    thumbnail/caption shape the organizer's gallery does)."""

    match_count = serializers.IntegerField()
    matched_media = GalleryMediaSerializer(many=True)
