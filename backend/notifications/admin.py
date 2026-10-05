from django.contrib import admin

from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    """Admin configuration for notification send logs."""

    list_display = (
        "guest",
        "channel",
        "status",
        "retry_count",
        "created_at",
    )

    list_filter = (
        "channel",
        "status",
    )

    search_fields = (
        "guest__name",
        "guest__mobile_number",
        "guest__email",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "wa_link",
        "failure_reason",
        "created_at",
        "updated_at",
    )
