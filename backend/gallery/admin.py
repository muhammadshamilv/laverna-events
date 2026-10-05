from django.contrib import admin

from .models import FaceEmbedding, GalleryMedia


@admin.register(GalleryMedia)
class GalleryMediaAdmin(admin.ModelAdmin):
    list_display = ("event", "media_type", "face_scan_status", "is_featured", "uploaded_by", "created_at")
    list_filter = ("media_type", "face_scan_status", "is_featured")
    search_fields = ("event__name", "caption")
    autocomplete_fields = ("event", "uploaded_by")
    readonly_fields = ("face_scan_status", "created_at", "updated_at")


@admin.register(FaceEmbedding)
class FaceEmbeddingAdmin(admin.ModelAdmin):
    """Read-only in the admin - embeddings are only ever created by
    gallery.services.scan_media_for_faces, never hand-edited."""

    list_display = ("media", "created_at")
    search_fields = ("media__event__name",)
    autocomplete_fields = ("media",)
    readonly_fields = ("media", "encoding_json", "created_at", "updated_at")

    def has_add_permission(self, request):
        return False
