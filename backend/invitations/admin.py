from django.contrib import admin

from .models import ActiveFilledTemplate, Invitation, InvitationTemplate, TemplateCustomField


class TemplateCustomFieldInline(admin.TabularInline):
    """Inline editor for a template's custom field definitions.

    Phase 20. Lets an admin define custom fields (e.g. bride_name,
    groom_name) directly on a platform InvitationTemplate's own edit
    page, right alongside body_text - so the two stay easy to keep in
    sync (a field referenced in body_text should have a matching row here).
    """

    model = TemplateCustomField
    extra = 1
    fields = ("field_key", "label", "display_order")
    ordering = ("display_order", "id")


@admin.register(InvitationTemplate)
class InvitationTemplateAdmin(admin.ModelAdmin):
    """Admin configuration for the invitation template catalog."""

    list_display = (
        "name",
        "channel",
        "is_custom",
        "is_active",
        "display_order",
        "created_at",
    )

    list_filter = (
        "is_active",
        "channel",
        "is_custom",
    )

    search_fields = (
        "name",
    )

    ordering = (
        "display_order",
        "name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    inlines = [TemplateCustomFieldInline]


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    """Admin configuration for generated invitations."""

    list_display = (
        "guest",
        "event",
        "template",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "template",
    )

    search_fields = (
        "guest__name",
        "guest__mobile_number",
        "event__name",
        "response_token",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "response_token",
        "created_at",
        "updated_at",
    )


@admin.register(ActiveFilledTemplate)
class ActiveFilledTemplateAdmin(admin.ModelAdmin):
    """Admin configuration for the one-active-filled-template-per-organizer state.

    Phase 20. Mainly useful for support/debugging - seeing at a glance
    which organizer currently has which template active, for which
    event, and what values were confirmed, without needing to ask the
    organizer to screenshot their Templates page.
    """

    list_display = (
        "organizer",
        "template",
        "event",
        "updated_at",
    )

    search_fields = (
        "organizer__mobile_number",
        "organizer__email",
        "template__name",
        "event__name",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )