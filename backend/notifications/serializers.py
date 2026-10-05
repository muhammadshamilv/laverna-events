from rest_framework import serializers

from .models import NotificationLog


class SendActiveTemplateSerializer(serializers.Serializer):
    """Serializer for the Guests page's single-guest Send action.

    `channel` is chosen by the organizer on the Guests page at send time.
    It is optional only for backward compatibility: when omitted, the
    active template's own channel is used, as before.
    """

    guest_id = serializers.IntegerField(required=True)
    channel = serializers.ChoiceField(
        choices=NotificationLog.Channel.choices,
        required=False,
    )


class SendBulkInvitationsSerializer(serializers.Serializer):
    """Serializer for one batch of a bulk Email / SMS / Voice Call send.

    Select guests by any combination of explicit ids, whole categories,
    the "uncategorized" group, or `select_all`. `after_id` and
    `batch_size` are the cursor the frontend uses to walk through the
    selection batch by batch (see services.send_bulk_invitations).
    """

    channel = serializers.ChoiceField(choices=NotificationLog.Channel.choices)
    guest_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
        max_length=5000,
    )
    category_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        default=list,
        max_length=500,
    )
    include_uncategorized = serializers.BooleanField(required=False, default=False)
    select_all = serializers.BooleanField(required=False, default=False)
    skip_already_sent = serializers.BooleanField(required=False, default=True)
    after_id = serializers.IntegerField(required=False, default=0, min_value=0)
    batch_size = serializers.IntegerField(required=False, default=10, min_value=1, max_value=25)

    def validate_channel(self, value: str) -> str:
        if value == NotificationLog.Channel.WHATSAPP:
            raise serializers.ValidationError(
                "WhatsApp invitations are sent one guest at a time."
            )

        return value

    def validate(self, attrs: dict) -> dict:
        has_selector = (
            attrs["select_all"]
            or attrs["guest_ids"]
            or attrs["category_ids"]
            or attrs["include_uncategorized"]
        )

        if not has_selector:
            raise serializers.ValidationError(
                "Select at least one guest or category to send to."
            )

        return attrs


class NotificationLogSerializer(serializers.ModelSerializer):
    """Serializer for reading a notification send log."""

    guest_name = serializers.CharField(source="guest.name", read_only=True)
    template_name = serializers.CharField(
        source="invitation.template.name", read_only=True
    )

    class Meta:
        model = NotificationLog
        fields = (
            "id",
            "guest",
            "guest_name",
            "template_name",
            "channel",
            "wa_link",
            "call_sid",
            "status",
            "failure_reason",
            "retry_count",
            "created_at",
        )
        read_only_fields = fields