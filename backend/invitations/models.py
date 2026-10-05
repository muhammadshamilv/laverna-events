from common.models import TimeStampedModel
from django.db import models


class InvitationTemplate(TimeStampedModel):
    """A reusable invitation design.

    Phase 15: templates are channel-specific (WhatsApp/Email/SMS content
    shapes are fundamentally different - SMS is plain 160-char text,
    Email is rich image-based, WhatsApp is plain prefill text) and can be
    either platform-provided (owner is null, admin-managed, visible to
    every organizer) or organizer-uploaded custom templates (owner set,
    is_custom True, visible only to that organizer). Access is gated by
    the organizer's membership plan via the plan's `template_limit` COUNT
    (see memberships.utils.check_template_limit), not a specific list.

    Phase 18: added body_text, a plain-text template string using the
    platform's fixed standard placeholders ({guest_name}, {event_name},
    {event_date}, {event_time}, {venue_name}, {venue_address},
    {host_name}).

    Phase 20: a template may ALSO define its own CUSTOM fields beyond the
    fixed standard set (e.g. bride_name, groom_name) - see
    TemplateCustomField below. body_text may reference both the standard
    PLACEHOLDER_FIELDS and this template's own custom field keys. This
    reopens Phase 18's "no per-template custom field schema" note above -
    the fixed set still exists and still auto-fills from the Event, but
    it's no longer the complete set of usable placeholders.

    Phase 20 also changes WHEN a template's content gets filled in:
    instead of filling per-guest at send time, the organizer now selects
    a template on the Templates page, picks an event, fills in the
    standard fields (auto-filled from the event, editable) and any custom
    fields, and confirms - producing an ActiveFilledTemplate. The Guests
    page Send action no longer picks a template or fills anything; it
    just sends whatever is currently the organizer's one active filled
    template, substituting only guest_name per guest.
    """

    class Channel(models.TextChoices):
        WHATSAPP = "WHATSAPP", "WhatsApp"
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"
        VOICE_CALL = "VOICE_CALL", "Voice Call"

    # Phase 18: the platform's fixed, standard placeholder set. Every
    # template (regardless of channel) may use any of these inside
    # body_text. Phase 20: a template may ADDITIONALLY define its own
    # custom fields (see TemplateCustomField) - this list is no longer
    # the complete set of placeholders a template can use, just the ones
    # that auto-fill from the Event and never need admin/organizer setup.
    PLACEHOLDER_FIELDS = [
        "guest_name",
        "event_name",
        "event_date",
        "event_time",
        "venue_name",
        "venue_address",
        "host_name",
    ]

    name = models.CharField(
        max_length=150,
    )

    description = models.TextField(
        blank=True,
    )

    channel = models.CharField(
        max_length=10,
        choices=Channel.choices,
        default=Channel.EMAIL,
        help_text="Which send channel this template's content is designed for.",
    )

    preview_image = models.ImageField(
        upload_to="invitations/templates/",
        blank=True,
        null=True,
    )

    background_image = models.ImageField(
        upload_to="invitations/templates/backgrounds/",
        blank=True,
        null=True,
        help_text="Base image used to render personalized invitations (Email image-based sends). Not used for WhatsApp/SMS templates.",
    )

    body_text = models.TextField(
        blank=True,
        help_text=(
            "Plain-text content using placeholders like {guest_name}, "
            "{event_name}, {event_date}, {event_time}, {venue_name}, "
            "{venue_address}, {host_name}, plus any of this template's own "
            "custom fields (see TemplateCustomField). Required for "
            "WhatsApp/SMS/Voice Call templates (Voice Call text is read "
            "aloud via text-to-speech); optional extra copy for Email templates."
        ),
    )

    owner = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="custom_invitation_templates",
    )

    is_custom = models.BooleanField(
        default=False,
        help_text="True for an organizer's own uploaded template, False for a platform-provided one.",
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Inactive templates are hidden from organizers.",
    )

    display_order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        db_table = "invitation_templates"
        ordering = ["display_order", "name"]

    def __str__(self) -> str:
        return self.name

    def custom_field_keys(self) -> list[str]:
        """Return this template's own custom field keys, in display order."""

        return list(
            self.custom_fields.order_by("display_order", "id").values_list("field_key", flat=True)
        )


class TemplateCustomField(TimeStampedModel):
    """A single custom placeholder field defined by a specific template.

    Phase 20. Lets a template author (admin for a platform template, or an
    organizer for their own custom upload) declare fields beyond the fixed
    standard set - e.g. a wedding template might define bride_name and
    groom_name. field_key is what appears in body_text as {field_key};
    label is the human-readable prompt shown on the fill-in form.

    These are NOT auto-filled from the Event - the organizer types a value
    for each one when filling the template on the Templates page (see
    ActiveFilledTemplate.custom_values).
    """

    template = models.ForeignKey(
        InvitationTemplate,
        on_delete=models.CASCADE,
        related_name="custom_fields",
    )

    field_key = models.SlugField(
        max_length=50,
        help_text="Used in body_text as {field_key}. Letters, numbers, underscores only.",
    )

    label = models.CharField(
        max_length=100,
        help_text="Human-readable prompt shown on the fill-in form, e.g. \"Bride's Name\".",
    )

    display_order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        db_table = "invitation_template_custom_fields"
        ordering = ["display_order", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["template", "field_key"],
                name="unique_custom_field_key_per_template",
            )
        ]

    def __str__(self) -> str:
        return f"{self.template.name}: {{{self.field_key}}}"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.field_key in InvitationTemplate.PLACEHOLDER_FIELDS:
            raise ValidationError(
                {
                    "field_key": (
                        f"\"{self.field_key}\" is already a standard placeholder "
                        "and cannot be redefined as a custom field."
                    )
                }
            )


class ActiveFilledTemplate(TimeStampedModel):
    """The ONE template an organizer has currently selected and filled in,
    ready to send to guests.

    Phase 20. One row per organizer (OneToOneField), globally - NOT per
    event. The organizer selects a template on the Templates page, picks
    which event it's for (so standard fields can auto-fill from that
    Event), fills in/overrides the standard fields and any custom fields,
    and confirms - this row is created/updated at that point.

    The Guests page Send action does NOT pick a template at all: it looks
    up the organizer's ActiveFilledTemplate (if any) and sends it as-is to
    whichever guest was clicked, substituting only {guest_name} at send
    time. Every other placeholder (event_name, event_date, venue_name,
    custom fields like bride_name/groom_name, etc.) was already fixed in
    at fill-time and is identical for every guest until the organizer
    goes back to the Templates page, deselects (deleting this row), and
    selects+fills a different template.

    standard_values holds the (possibly organizer-edited) standard field
    values as actually confirmed - NOT re-read live from the Event at
    send time, so editing the Event afterwards doesn't silently change
    already-filled invitation content. custom_values holds this
    template's own custom field values (e.g. {"bride_name": "Asha",
    "groom_name": "Rohit"}).
    """

    organizer = models.OneToOneField(
        "users.User",
        on_delete=models.CASCADE,
        related_name="active_filled_template",
    )

    template = models.ForeignKey(
        InvitationTemplate,
        on_delete=models.CASCADE,
        related_name="active_fills",
    )

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="active_filled_templates",
    )

    standard_values = models.JSONField(
        default=dict,
        help_text="Confirmed values for the fixed standard placeholder fields (event_name, event_date, etc.), auto-filled from the event but editable at fill-time.",
    )

    custom_values = models.JSONField(
        default=dict,
        help_text="Confirmed values for this template's own custom fields (e.g. bride_name, groom_name).",
    )

    rendered_preview_text = models.TextField(
        blank=True,
        help_text="The fully-rendered body_text (all placeholders substituted except guest_name) shown as the separate confirmation preview.",
    )

    class Meta:
        db_table = "active_filled_templates"

    def __str__(self) -> str:
        return f"{self.organizer.mobile_number}'s active template: {self.template.name}"


class Invitation(TimeStampedModel):
    """A personalized invitation generated for a specific guest."""

    class Status(models.TextChoices):
        GENERATED = "GENERATED", "Generated"
        FAILED = "FAILED", "Failed"

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="invitations",
    )

    guest = models.ForeignKey(
        "guests.Guest",
        on_delete=models.CASCADE,
        related_name="invitations",
    )

    template = models.ForeignKey(
        InvitationTemplate,
        on_delete=models.PROTECT,
        related_name="invitations",
    )

    response_token = models.CharField(
        max_length=64,
        unique=True,
        help_text="Unique token used in the guest's secure response link.",
    )

    image_file = models.ImageField(
        upload_to="invitations/generated/images/",
        blank=True,
        null=True,
    )

    pdf_file = models.FileField(
        upload_to="invitations/generated/pdfs/",
        blank=True,
        null=True,
    )

    rendered_text = models.TextField(
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.GENERATED,
    )

    class Meta:
        db_table = "invitations"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["guest", "template"],
                name="unique_invitation_per_guest_template",
            )
        ]

    def __str__(self) -> str:
        return f"Invitation for {self.guest.name} ({self.event.name})"


class InvitationSend(TimeStampedModel):
    """An audit record of one attempt to deliver an invitation to one
    guest, over one channel."""

    class Channel(models.TextChoices):
        WHATSAPP = "WHATSAPP", "WhatsApp"
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"
        VOICE_CALL = "VOICE_CALL", "Voice Call"

    class Status(models.TextChoices):
        SENT = "SENT", "Sent"
        FAILED = "FAILED", "Failed"
        SKIPPED_QUOTA = "SKIPPED_QUOTA", "Skipped (Quota Exceeded)"
        PENDING_MANUAL = "PENDING_MANUAL", "Pending Manual Confirmation"

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="invitation_sends",
    )

    guest = models.ForeignKey(
        "guests.Guest",
        on_delete=models.CASCADE,
        related_name="invitation_sends",
    )

    template = models.ForeignKey(
        InvitationTemplate,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sends",
    )

    channel = models.CharField(
        max_length=10,
        choices=Channel.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING_MANUAL,
    )

    is_reminder = models.BooleanField(
        default=False,
        help_text="True if this send was triggered by the reminder system rather than the organizer's initial send.",
    )

    failure_reason = models.CharField(
        max_length=255,
        blank=True,
    )

    sent_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="invitation_sends_made",
    )

    sent_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "invitation_sends"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.channel} to {self.guest.name} ({self.status})"
    
    
class ReminderSchedule(TimeStampedModel):
    """A 'remind guests who haven't responded after N hours' rule.

    Phase 22. Scoped to an event, and either to one GuestCategory (applies
    to every guest in that category) OR to one specific Guest (an
    individual override for that guest alone) - never both, enforced by
    the CheckConstraint below. At most ONE active schedule may exist per
    category or per individually-overridden guest at a time (enforced by
    the UniqueConstraints below) - no stacking of multiple delays.

    When resolving which schedule applies to a given guest, an individual
    guest-level schedule takes priority over that guest's category-level
    schedule (see services.get_applicable_schedule). A guest with neither
    gets no automatic reminder.
    """

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="reminder_schedules",
    )

    category = models.ForeignKey(
        "guests.GuestCategory",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reminder_schedules",
    )

    guest = models.ForeignKey(
        "guests.Guest",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reminder_schedules",
    )

    delay_hours = models.PositiveIntegerField(
        help_text="Hours after the guest's invitation was sent before a reminder is due, if they still haven't responded.",
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Inactive schedules are kept for history but no longer trigger reminders.",
    )

    class Meta:
        db_table = "reminder_schedules"
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(category__isnull=False, guest__isnull=True)
                    | models.Q(category__isnull=True, guest__isnull=False)
                ),
                name="reminder_schedule_exactly_one_scope",
            ),
            models.UniqueConstraint(
                fields=["category"],
                condition=models.Q(is_active=True, category__isnull=False),
                name="one_active_schedule_per_category",
            ),
            models.UniqueConstraint(
                fields=["guest"],
                condition=models.Q(is_active=True, guest__isnull=False),
                name="one_active_schedule_per_guest",
            ),
        ]

    def __str__(self) -> str:
        scope = self.guest.name if self.guest_id else (self.category.name if self.category_id else "?")
        return f"Remind {scope} after {self.delay_hours}h ({self.event.name})"


class PendingWhatsAppReminder(TimeStampedModel):
    """A WhatsApp reminder that has come due but needs the organizer to
    actually tap Send (no server-side auto-send is possible for WhatsApp
    without Business API - see notifications/services.py).

    Phase 22. Created by the Celery task when a guest's reminder becomes
    due and their invitation's channel is WHATSAPP. Shown as a "Reminders
    due" list in the app; one-click sending it (same flow as a normal
    WhatsApp send) deletes this row. A guest can only have one pending
    row at a time (unique constraint) - if the organizer ignores it and a
    LATER schedule somehow also comes due, it doesn't stack, it just
    stays as the one outstanding reminder for that guest.
    """

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="pending_whatsapp_reminders",
    )

    guest = models.ForeignKey(
        "guests.Guest",
        on_delete=models.CASCADE,
        related_name="pending_whatsapp_reminders",
    )

    schedule = models.ForeignKey(
        ReminderSchedule,
        on_delete=models.SET_NULL,
        null=True,
        related_name="pending_whatsapp_reminders",
    )

    due_at = models.DateTimeField(
        help_text="When this reminder became due (for display/sorting, not a deadline).",
    )

    class Meta:
        db_table = "pending_whatsapp_reminders"
        constraints = [
            models.UniqueConstraint(
                fields=["guest"],
                name="one_pending_whatsapp_reminder_per_guest",
            )
        ]
        ordering = ["due_at"]

    def __str__(self) -> str:
        return f"Pending WhatsApp reminder for {self.guest.name}"