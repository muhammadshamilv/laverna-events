from common.models import TimeStampedModel
from django.db import models


class GuestCategory(TimeStampedModel):
    """An organizer-defined grouping of guests within one event.

    Phase 15: created per event, not platform-wide - different events
    (weddings, birthdays, corporate functions) naturally want different
    category sets. A helper (see guests/services.py) seeds a sensible
    default set (Family, Friends, Relatives, Special Guest, VIP) on
    event creation, which the organizer can then rename, reorder, add
    to, or delete freely.
    """

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="guest_categories",
    )

    name = models.CharField(
        max_length=80,
    )

    display_order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        db_table = "guest_categories"
        ordering = ["display_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["event", "name"],
                name="unique_category_name_per_event",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.event.name})"


class Guest(TimeStampedModel):
    """A guest invited to a specific event."""

    class InvitationStatus(models.TextChoices):
        NOT_SENT = "NOT_SENT", "Not Sent"
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"

    class ResponseStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        MAYBE = "MAYBE", "Maybe"

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="guests",
    )

    # Phase 15. Nullable: a guest can exist uncategorized (e.g. imported
    # in bulk before sorting) and SET_NULL so deleting a category never
    # deletes the guests in it - they just become uncategorized again.
    category = models.ForeignKey(
        GuestCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="guests",
    )

    name = models.CharField(
        max_length=150,
    )

    mobile_number = models.CharField(
        max_length=20,
    )

    email = models.EmailField(
        blank=True,
        help_text="Optional. Required only if the organizer sends this guest's invitation via email.",
    )

    family_member_count = models.PositiveIntegerField(
        default=3,
        help_text="Used for expected attendance calculation.",
    )

    # Phase 15: this stays as a cheap overall summary ("has at least one
    # channel successfully delivered this guest an invitation yet"),
    # updated automatically by invitations/services.py whenever an
    # InvitationSend succeeds. The detailed per-channel, per-attempt
    # history lives in InvitationSend (see invitations/models.py) -
    # this field is intentionally NOT the source of truth for reports
    # or reminders, just a fast summary for guest list/filter UI.
    invitation_status = models.CharField(
        max_length=20,
        choices=InvitationStatus.choices,
        default=InvitationStatus.NOT_SENT,
    )

    response_status = models.CharField(
        max_length=20,
        choices=ResponseStatus.choices,
        default=ResponseStatus.PENDING,
    )

    responded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the guest submitted their Accept/Reject/Maybe response.",
    )

    notes = models.CharField(
        max_length=255,
        blank=True,
    )

    class Meta:
        db_table = "guests"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["event", "mobile_number"],
                name="unique_guest_per_event",
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.event.name})"