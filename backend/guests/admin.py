from django.contrib import admin

from .models import Guest


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    """Admin configuration for guests."""

    list_display = (
        "name",
        "mobile_number",
        "event",
        "family_member_count",
        "invitation_status",
        "response_status",
        "responded_at",
        "created_at",
    )

    list_filter = (
        "invitation_status",
        "response_status",
    )

    search_fields = (
        "name",
        "mobile_number",
        "event__name",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "responded_at",
        "created_at",
        "updated_at",
    )
