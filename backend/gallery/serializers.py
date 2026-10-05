from rest_framework import serializers

from .models import GalleryMedia

IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


class UploadedBySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    role = serializers.CharField()


class GalleryMediaSerializer(serializers.ModelSerializer):
    """Read serializer - used for both the organizer's and the photographer's gallery views."""

    uploaded_by = UploadedBySerializer(read_only=True)

    class Meta:
        model = GalleryMedia
        fields = (
            "id",
            "media_type",
            "file",
            "thumbnail",
            "caption",
            "is_featured",
            "uploaded_by",
            "created_at",
        )
        read_only_fields = fields


class GalleryMediaUploadSerializer(serializers.Serializer):
    """Validates a single-file upload. media_type is inferred from the
    file's extension server-side rather than trusted from the client, so a
    mismatched/spoofed media_type can't be submitted."""

    file = serializers.FileField()
    caption = serializers.CharField(required=False, allow_blank=True, default="")
    thumbnail = serializers.ImageField(required=False, allow_null=True)

    def validate_file(self, value):
        extension = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""

        if extension not in IMAGE_EXTENSIONS | {"mp4", "mov", "webm"}:
            raise serializers.ValidationError(
                "Unsupported file type. Allowed: jpg, jpeg, png, webp, mp4, mov, webm."
            )

        self.context["media_type"] = (
            GalleryMedia.MediaType.IMAGE
            if extension in IMAGE_EXTENSIONS
            else GalleryMedia.MediaType.VIDEO
        )

        return value
