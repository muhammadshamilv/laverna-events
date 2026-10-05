from rest_framework import serializers

from users.models import User

from .models import PhotographerEventAccess


class GrantPhotographerAccessSerializer(serializers.Serializer):
    """Validates an organizer's request to grant a photographer access to one event.

    Takes the photographer's mobile_number rather than an id - the
    organizer looks the photographer up by the number they were given
    (e.g. over WhatsApp/phone), the same way they'd identify anyone in
    real life, not by hunting for an internal user id.
    """

    mobile_number = serializers.CharField()
    expires_at = serializers.DateTimeField(required=False, allow_null=True)

    def validate_mobile_number(self, value: str) -> str:
        value = value.strip()

        user = User.objects.filter(
            mobile_number=value,
            role=User.Role.PHOTOGRAPHER,
        ).first()

        if user is None:
            raise serializers.ValidationError(
                "No photographer account found with this mobile number. "
                "The photographer must register first."
            )

        self.context["photographer"] = user

        return value


class PhotographerSummarySerializer(serializers.ModelSerializer):
    """Minimal photographer identity - shown to organizers reviewing/granting access."""

    class Meta:
        model = User
        fields = ("id", "full_name", "mobile_number", "email")


class EventSummarySerializer(serializers.Serializer):
    """Minimal event identity - shown to photographers browsing their granted events."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    event_type = serializers.CharField()
    event_date = serializers.DateField()
    event_time = serializers.TimeField()
    venue_name = serializers.CharField()
    cover_image = serializers.SerializerMethodField()

    def get_cover_image(self, event) -> str | None:
        request = self.context.get("request")

        if not event.cover_image:
            return None

        url = event.cover_image.url

        if request is not None:
            return request.build_absolute_uri(url)

        return url


class PhotographerAccessSerializer(serializers.ModelSerializer):
    """Full access-grant record, as shown to the organizer managing an event's photographers."""

    photographer = PhotographerSummarySerializer(read_only=True)
    is_currently_valid = serializers.SerializerMethodField()

    class Meta:
        model = PhotographerEventAccess
        fields = (
            "id",
            "photographer",
            "granted_by",
            "is_active",
            "expires_at",
            "is_currently_valid",
            "created_at",
        )
        read_only_fields = fields

    def get_is_currently_valid(self, obj: PhotographerEventAccess) -> bool:
        return obj.is_currently_valid()


class PhotographerEventGrantSerializer(serializers.ModelSerializer):
    """A single granted-event entry, as shown to the photographer themself."""

    event = EventSummarySerializer(read_only=True)
    is_currently_valid = serializers.SerializerMethodField()

    class Meta:
        model = PhotographerEventAccess
        fields = (
            "id",
            "event",
            "expires_at",
            "is_currently_valid",
            "created_at",
        )
        read_only_fields = fields

    def get_is_currently_valid(self, obj: PhotographerEventAccess) -> bool:
        return obj.is_currently_valid()
