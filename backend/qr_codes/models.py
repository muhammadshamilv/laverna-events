import uuid

from common.models import TimeStampedModel
from django.db import models


class EventQRCode(TimeStampedModel):
    """The single, permanent QR code for one event.

    One-to-one with Event rather than living as fields on Event itself,
    so the QR/scan domain (this app) stays fully separate from the core
    events domain - Phase 13 never needs to touch events/models.py.

    `token` is the opaque public identifier embedded in the QR image's
    URL (e.g. https://app.example.com/scan/<token>/). It is intentionally
    NOT the event's numeric primary key - a guest who scans the code (or
    inspects the URL) should not be able to guess or enumerate other
    events' QR URLs by incrementing an integer.

    The QR image itself (the PNG) is generated on demand in services.py
    rather than stored as a file here - it is fully deterministic from
    `token` alone, so persisting a generated image would just be a cache
    with no invalidation story. If this becomes a performance concern
    later (repeated PDF/PNG downloads), a `cached_png` ImageField can be
    added without any migration-breaking change to this model's meaning.
    """

    event = models.OneToOneField(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="qr_code",
    )

    token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        db_index=True,
        help_text="Opaque public identifier embedded in the QR code's URL. Never the event's numeric id.",
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Organizer can deactivate a QR code (e.g. event postponed/cancelled) without deleting it.",
    )

    class Meta:
        db_table = "event_qr_codes"

    def __str__(self) -> str:
        return f"QR code for {self.event.name}"


class GuestSelfieSession(TimeStampedModel):
    """One record per guest selfie-scan attempt at an event.

    Purely a lightweight audit/analytics trail (how many guests scanned,
    how many got matches, how many downloaded) - it is NOT an identity
    record. Per the fully-anonymous guest flow, this is never linked to
    a Guest/RSVP row; `matched_media` is the only meaningful output, and
    the selfie image itself is not retained (see services.py) once
    matching is complete, since keeping a biometric photo around with no
    guest consent/account attached is an unnecessary privacy liability.
    """

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="selfie_sessions",
    )

    matched_media = models.ManyToManyField(
        "gallery.GalleryMedia",
        related_name="matched_selfie_sessions",
        blank=True,
    )

    match_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "guest_selfie_sessions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Selfie session for {self.event.name} ({self.match_count} matches)"
