from common.models import TimeStampedModel
from django.db import models


class NotificationLog(TimeStampedModel):
    """Tracks an invitation send attempt through any channel.

    Phase 21: added VOICE_CALL to Channel, and call_sid to store Twilio's
    CallSid (its reference for this call) - used both for the admin/organizer
    to look up a call in the Twilio console, and as the row Twilio's status
    callback updates when the call's outcome becomes known (see
    notifications/views.py's TwilioCallStatusCallbackView).
    """

    class Channel(models.TextChoices):
        WHATSAPP = "WHATSAPP", "WhatsApp"
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"
        VOICE_CALL = "VOICE_CALL", "Voice Call"

    class Status(models.TextChoices):
        LINK_GENERATED = "LINK_GENERATED", "Link Generated"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"
        # Phase 21: a voice call is asynchronous - initiating it only
        # confirms Twilio ACCEPTED the request to place the call, not
        # that the guest actually answered. The real outcome arrives
        # later via Twilio's status callback webhook.
        CALLING = "CALLING", "Calling"

    invitation = models.ForeignKey(
        "invitations.Invitation",
        on_delete=models.CASCADE,
        related_name="notification_logs",
    )

    guest = models.ForeignKey(
        "guests.Guest",
        on_delete=models.CASCADE,
        related_name="notification_logs",
    )

    channel = models.CharField(
        max_length=20,
        choices=Channel.choices,
    )

    wa_link = models.URLField(
        max_length=1000,
        blank=True,
        help_text="Populated only for the WhatsApp channel.",
    )

    call_sid = models.CharField(
        max_length=64,
        blank=True,
        help_text="Twilio's CallSid for this call. Populated only for the Voice Call channel.",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.LINK_GENERATED,
    )

    failure_reason = models.CharField(
        max_length=255,
        blank=True,
    )

    retry_count = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        db_table = "notification_logs"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.channel} to {self.guest.name} ({self.status})"