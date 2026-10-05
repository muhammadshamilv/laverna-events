from common.models import TimeStampedModel
from django.db import models


class PhotographerEventAccess(TimeStampedModel):
    """Grants a photographer temporary access to a single event's gallery.

    This is the ONLY access-control surface for photographers - there is no
    per-photographer global permission. An organizer explicitly grants
    access to one event at a time (optionally time-boxed via expires_at)
    and can revoke it at any moment by setting is_active=False. A
    photographer with no active, non-expired grant for an event cannot see
    or upload to that event's gallery at all, enforced in the view layer
    via has_active_access() below, not just hidden in the UI.
    """

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="photographer_access_grants",
    )

    photographer = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="event_access_grants",
        limit_choices_to={"role": "PHOTOGRAPHER"},
    )

    granted_by = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="granted_photographer_access",
        help_text="The organizer who granted this access.",
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Set to False by the organizer to revoke access immediately.",
    )

    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Optional. If set, access is treated as revoked after this time even if is_active is still True.",
    )

    class Meta:
        db_table = "photographer_event_access"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["event", "photographer"],
                name="unique_photographer_per_event",
            )
        ]

    def __str__(self) -> str:
        return f"{self.photographer.full_name} -> {self.event.name}"

    def is_currently_valid(self) -> bool:
        """Check whether this grant currently allows access.

        True only if the organizer hasn't revoked it (is_active) AND
        (there's no expiry, or the expiry hasn't passed yet).
        """

        from django.utils import timezone

        if not self.is_active:
            return False

        if self.expires_at is not None and timezone.now() > self.expires_at:
            return False

        return True
