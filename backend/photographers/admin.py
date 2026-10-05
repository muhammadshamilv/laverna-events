from django.contrib import admin

from .models import PhotographerEventAccess


@admin.register(PhotographerEventAccess)
class PhotographerEventAccessAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "event",
        "photographer",
        "granted_by",
        "is_active",
        "expires_at",
        "created_at",
    )
    list_filter = ("is_active",)
    search_fields = (
        "event__name",
        "photographer__full_name",
        "photographer__mobile_number",
    )
    autocomplete_fields = ("event", "photographer", "granted_by")
