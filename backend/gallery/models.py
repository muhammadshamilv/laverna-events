import json

from common.models import TimeStampedModel
from django.core.validators import FileExtensionValidator
from django.db import models


class GalleryMedia(TimeStampedModel):
    """A single photo or video uploaded to an event's gallery.

    Uploaded either by the organizer themself or by a photographer with a
    currently-valid PhotographerEventAccess grant for this event (enforced
    in the view layer, not here). uploaded_by is kept even after access is
    later revoked, so the organizer always knows who contributed which
    media - revoking access stops future uploads, it never retroactively
    hides or deletes past ones.
    """

    class MediaType(models.TextChoices):
        IMAGE = "IMAGE", "Image"
        VIDEO = "VIDEO", "Video"

    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="gallery_media",
    )

    uploaded_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_gallery_media",
    )

    media_type = models.CharField(
        max_length=10,
        choices=MediaType.choices,
    )

    file = models.FileField(
        upload_to="gallery/%Y/%m/",
        validators=[
            FileExtensionValidator(
                allowed_extensions=[
                    "jpg", "jpeg", "png", "webp",
                    "mp4", "mov", "webm",
                ]
            )
        ],
    )

    thumbnail = models.ImageField(
        upload_to="gallery/thumbnails/%Y/%m/",
        blank=True,
        null=True,
        help_text="Optional. For videos, a poster frame the frontend can generate/upload alongside the video.",
    )

    caption = models.CharField(
        max_length=200,
        blank=True,
    )

    is_featured = models.BooleanField(
        default=False,
        help_text="Organizer can pin/feature select media to show first.",
    )

    # Phase 14 (Admin Portal) - populated at upload time (see
    # gallery/services.py's upload_media()) in bytes, so the admin's
    # Storage Usage dashboard/report can sum real file sizes instead of
    # re-reading every file from disk on every request. Nullable so
    # existing rows created before this field existed don't need a
    # backfill to pass validation; they are simply treated as 0 bytes in
    # the admin's storage aggregation (Sum() skips NULLs).
    file_size = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes, captured at upload time.",
    )

    # --- Phase 13: face-matching state -----------------------------------
    # Face detection/embedding runs once, automatically, right after a
    # photo is uploaded (see gallery/services.py's upload_media), rather
    # than on demand when a guest scans - so a guest's selfie match only
    # ever has to compare against already-computed embeddings, not wait
    # for every photo in the gallery to be processed live. This status
    # field lets the organizer/admin tell a photo apart from one still
    # queued vs. one Django couldn't find any faces in (e.g. a venue/
    # decor photo with no people) vs. a genuine failure.
    class FaceScanStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PROCESSED = "PROCESSED", "Processed"
        FAILED = "FAILED", "Failed"

    face_scan_status = models.CharField(
        max_length=10,
        choices=FaceScanStatus.choices,
        default=FaceScanStatus.PENDING,
        help_text="Whether this photo has been scanned for faces yet. Only IMAGE media is ever scanned.",
    )

    class Meta:
        db_table = "gallery_media"
        ordering = ["-is_featured", "-created_at"]

    def __str__(self) -> str:
        return f"{self.media_type} for {self.event.name}"


class FaceEmbedding(TimeStampedModel):
    """One detected face within one gallery photo, stored as a 128-d
    face_recognition encoding.

    A single photo can contain several faces (group photos), so this is
    deliberately a separate table with a FK to GalleryMedia rather than a
    single embedding field on GalleryMedia itself - one photo, many rows.

    `encoding` is stored as JSON (a list of 128 floats) rather than a
    Postgres array/vector column, so this works on the project's existing
    Postgres setup with no extra extension (e.g. pgvector) required.
    Matching (qr_codes/services.py) loads the relevant event's embeddings
    into memory and compares with face_recognition.face_distance -
    perfectly fast at the scale of a single event's gallery (hundreds,
    not millions, of faces).
    """

    media = models.ForeignKey(
        GalleryMedia,
        on_delete=models.CASCADE,
        related_name="face_embeddings",
    )

    encoding_json = models.TextField(
        help_text="JSON-encoded list of 128 floats (a face_recognition face encoding).",
    )

    class Meta:
        db_table = "gallery_face_embeddings"

    def __str__(self) -> str:
        return f"Face embedding for media #{self.media_id}"

    @property
    def encoding(self) -> list[float]:
        return json.loads(self.encoding_json)

    @encoding.setter
    def encoding(self, value) -> None:
        self.encoding_json = json.dumps(list(value))
