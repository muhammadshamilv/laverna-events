from django.contrib import admin

from .models import EventQRCode, GuestSelfieSession


@admin.register(EventQRCode)
class EventQRCodeAdmin(admin.ModelAdmin):
    list_display = ("event", "token", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("event__name", "token")
    autocomplete_fields = ("event",)
    readonly_fields = ("token", "created_at", "updated_at")


@admin.register(GuestSelfieSession)
class GuestSelfieSessionAdmin(admin.ModelAdmin):
    list_display = ("event", "match_count", "created_at")
    list_filter = ("event",)
    search_fields = ("event__name",)
    autocomplete_fields = ("event",)
    readonly_fields = ("created_at", "updated_at")
