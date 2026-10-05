# backend/gallery/services.py
from events.models import Event

from .models import GalleryMedia


class GalleryError(Exception):
    """Raised when a gallery action cannot be completed."""

    def __init__(self, message: str, code: str = "gallery_error"):
        self.message = message
        self.code = code
        super().__init__(message)


def can_view_gallery(user, event: Event) -> bool:
    """An organizer can always view their own event's gallery. A
    photographer can view it only with a currently-valid access grant."""

    if user.role == "ORGANIZER":
        return event.organizer_id == user.id

    if user.role == "PHOTOGRAPHER":
        from photographers.services import check_photographer_event_access, PhotographerAccessError

        try:
            check_photographer_event_access(user, event)
            return True
        except PhotographerAccessError:
            return False

    return False


def upload_media(event: Event, uploaded_by, media_type: str, file, thumbnail=None, caption: str = "") -> GalleryMedia:
    """Create a gallery media record. Caller is responsible for having
    already checked can_view_gallery/upload permission - this function
    itself does not re-check access, to keep it reusable from both the
    organizer and photographer upload endpoints without duplicating the
    access-check branch.

    Phase 14 (Admin Portal): captures the uploaded file's size in bytes
    at upload time (file.size is already available on any Django
    UploadedFile without re-reading the file) so the admin's storage
    usage dashboard/report can aggregate it cheaply later.
    """

    return GalleryMedia.objects.create(
        event=event,
        uploaded_by=uploaded_by,
        media_type=media_type,
        file=file,
        thumbnail=thumbnail,
        caption=caption,
        file_size=getattr(file, "size", None),
    )


def delete_media(media: GalleryMedia) -> None:
    """Permanently delete a gallery media item (and its file from storage)."""

    media.file.delete(save=False)

    if media.thumbnail:
        media.thumbnail.delete(save=False)

    media.delete()


def toggle_featured(media: GalleryMedia) -> GalleryMedia:
    """Flip a media item's featured flag."""

    media.is_featured = not media.is_featured
    media.save(update_fields=["is_featured", "updated_at"])

    return media
