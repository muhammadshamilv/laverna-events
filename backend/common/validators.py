from django.core.exceptions import ValidationError


def validate_image_file_size(file, max_size_mb: int = 5) -> None:
    """Raise ValidationError if the uploaded image exceeds max_size_mb.

    Usage inside a model field:
        validators=[lambda f: validate_image_file_size(f, max_size_mb=5)]
    """

    max_size_bytes = max_size_mb * 1024 * 1024

    if file.size > max_size_bytes:
        raise ValidationError(
            f"File too large. Maximum allowed size is {max_size_mb} MB."
        )


def validate_video_file_size(file, max_size_mb: int = 100) -> None:
    """Raise ValidationError if the uploaded video exceeds max_size_mb."""

    max_size_bytes = max_size_mb * 1024 * 1024

    if file.size > max_size_bytes:
        raise ValidationError(
            f"File too large. Maximum allowed size is {max_size_mb} MB."
        )


ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"]

ALLOWED_VIDEO_EXTENSIONS = ["mp4", "mov", "webm"]

ALLOWED_DOCUMENT_EXTENSIONS = ["pdf"]
