from rest_framework import serializers

from gallery.models import GalleryMedia
from invitations.models import InvitationTemplate
from memberships.models import MembershipPlan
from memberships.topup_models import PlatformChannelPool, PlatformPoolTopup, TopupPack
from users.models import User


# --------------------------------------------------
# Dashboard
# --------------------------------------------------

class AdminChannelUsageSerializer(serializers.Serializer):
    """Phase 26: one configured platform channel pool, as shown on the
    admin dashboard's capacity card."""

    channel = serializers.CharField()
    channel_display = serializers.CharField()
    total_capacity = serializers.IntegerField()
    used = serializers.IntegerField()
    remaining = serializers.IntegerField()
    is_low = serializers.BooleanField()
    is_exhausted = serializers.BooleanField()


class AdminDashboardStatsSerializer(serializers.Serializer):
    """Top-line numbers shown on the admin dashboard."""

    total_users = serializers.IntegerField()
    active_events = serializers.IntegerField()
    membership_sales = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    storage_usage_mb = serializers.FloatField()
    channel_usage = AdminChannelUsageSerializer(many=True)


# --------------------------------------------------
# User Management
# --------------------------------------------------

class AdminUserListSerializer(serializers.ModelSerializer):
    """Read serializer for the admin's user list/detail views."""

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "email",
            "mobile_number",
            "role",
            "is_verified",
            "is_active",
            "is_suspended",
            "created_at",
        )
        read_only_fields = fields


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for an admin editing a user's core profile fields.

    Deliberately excludes password, role changes are allowed (an admin may
    need to correct a mis-registered role), but is_suspended is handled by
    its own dedicated suspend/unsuspend endpoint instead of here, to keep
    that action auditable as a single explicit intent rather than a side
    effect of a generic PATCH.
    """

    class Meta:
        model = User
        fields = (
            "full_name",
            "email",
            "mobile_number",
            "role",
            "is_verified",
            "is_active",
        )

    def validate_email(self, value: str) -> str:
        value = value.strip().lower()

        queryset = User.objects.filter(email__iexact=value)

        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def validate_mobile_number(self, value: str) -> str:
        value = value.strip()

        if not value.isdigit() or not (10 <= len(value) <= 15):
            raise serializers.ValidationError(
                "Mobile number must contain 10-15 digits only."
            )

        queryset = User.objects.filter(mobile_number=value)

        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "A user with this mobile number already exists."
            )

        return value


# --------------------------------------------------
# Membership Management
# --------------------------------------------------

class AdminMembershipPlanSerializer(serializers.ModelSerializer):
    """Full read/write serializer for admin plan CRUD (unlike the public,
    read-only MembershipPlanSerializer in the memberships app).

    Phase 26 fix: the old "templates" field no longer exists on
    MembershipPlan (removed in Phase 17), so it is replaced by the three
    quota fields that took its place: total_invitations, template_limit
    and voice_call_limit.
    """

    class Meta:
        model = MembershipPlan
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "duration_days",
            "guest_limit",
            "event_limit",
            "total_invitations",
            "template_limit",
            "voice_call_limit",
            "storage_limit_mb",
            "gallery_enabled",
            "qr_code_enabled",
            "photographer_access_enabled",
            "is_active",
            "display_order",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_slug(self, value: str) -> str:
        value = value.strip().lower()

        queryset = MembershipPlan.objects.filter(slug=value)

        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "A plan with this slug already exists."
            )

        return value


# --------------------------------------------------
# Invitation Templates
# --------------------------------------------------

class AdminInvitationTemplateSerializer(serializers.ModelSerializer):
    """Full read/write serializer for admin template CRUD."""

    class Meta:
        model = InvitationTemplate
        fields = (
            "id",
            "name",
            "description",
            "preview_image",
            "background_image",
            "is_active",
            "display_order",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


# --------------------------------------------------
# Media Management
# --------------------------------------------------

class AdminGalleryMediaSerializer(serializers.ModelSerializer):
    """Read serializer for the admin's media management list."""

    event_name = serializers.CharField(source="event.name", read_only=True)
    uploaded_by_name = serializers.CharField(
        source="uploaded_by.full_name", read_only=True, default=None
    )

    class Meta:
        model = GalleryMedia
        fields = (
            "id",
            "event",
            "event_name",
            "media_type",
            "file",
            "thumbnail",
            "caption",
            "is_featured",
            "uploaded_by_name",
            "file_size",
            "created_at",
        )
        read_only_fields = fields


# --------------------------------------------------
# Reports
# --------------------------------------------------

class RevenueReportPointSerializer(serializers.Serializer):
    """One bucket (e.g. one day or month) of revenue."""

    period = serializers.CharField()
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)


class RegistrationsReportPointSerializer(serializers.Serializer):
    """One bucket of new user registrations."""

    period = serializers.CharField()
    count = serializers.IntegerField()


class MembershipStatsSerializer(serializers.Serializer):
    """Subscriber count per plan."""

    plan_name = serializers.CharField()
    active_subscribers = serializers.IntegerField()


class AdminReportsSerializer(serializers.Serializer):
    """Combined reports payload: Revenue, Registrations, Active Events,
    Membership Statistics, Storage Usage - matching the Phase 14 spec."""

    revenue_by_period = RevenueReportPointSerializer(many=True)
    registrations_by_period = RegistrationsReportPointSerializer(many=True)
    active_events_count = serializers.IntegerField()
    membership_statistics = MembershipStatsSerializer(many=True)
    storage_usage_mb = serializers.FloatField()


# --------------------------------------------------
# Phase 26: platform channel pools + topup packs (admin-managed)
# --------------------------------------------------

class PlatformChannelPoolSerializer(serializers.ModelSerializer):
    """Serializer for admin viewing/monitoring a platform channel pool.

    `is_configured` is False for a channel that has never been topped up
    (no database row yet). Such a channel is UNLIMITED as far as sending
    is concerned, so it must never be reported as low or exhausted.
    """

    channel_display = serializers.CharField(source="get_channel_display", read_only=True)
    remaining = serializers.SerializerMethodField()
    is_configured = serializers.SerializerMethodField()
    is_low = serializers.SerializerMethodField()
    is_exhausted = serializers.SerializerMethodField()

    class Meta:
        model = PlatformChannelPool
        fields = (
            "id",
            "channel",
            "channel_display",
            "total_capacity",
            "used",
            "remaining",
            "low_balance_threshold",
            "is_configured",
            "is_low",
            "is_exhausted",
            "updated_at",
        )
        read_only_fields = fields

    def get_remaining(self, obj: PlatformChannelPool) -> int:
        return obj.remaining()

    def get_is_configured(self, obj: PlatformChannelPool) -> bool:
        return obj.pk is not None

    def get_is_low(self, obj: PlatformChannelPool) -> bool:
        return obj.pk is not None and obj.is_low()

    def get_is_exhausted(self, obj: PlatformChannelPool) -> bool:
        return obj.pk is not None and obj.is_exhausted()


class PlatformPoolTopupCreateSerializer(serializers.Serializer):
    """Serializer for validating an admin request to top up a pool."""

    channel = serializers.ChoiceField(choices=PlatformChannelPool.Channel.choices)
    amount = serializers.IntegerField(min_value=1)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class PlatformPoolTopupSerializer(serializers.ModelSerializer):
    """Serializer for reading a pool's topup history (audit trail)."""

    channel = serializers.CharField(source="pool.channel", read_only=True)
    channel_display = serializers.CharField(source="pool.get_channel_display", read_only=True)
    topped_up_by_name = serializers.CharField(
        source="topped_up_by.full_name",
        read_only=True,
        default=None,
    )

    class Meta:
        model = PlatformPoolTopup
        fields = (
            "id",
            "channel",
            "channel_display",
            "amount",
            "note",
            "topped_up_by_name",
            "created_at",
        )
        read_only_fields = fields


class AdminTopupPackSerializer(serializers.ModelSerializer):
    """Serializer for admin CRUD on topup packs (the fixed packs organizers can buy)."""

    class Meta:
        model = TopupPack
        fields = (
            "id",
            "name",
            "kind",
            "quantity",
            "price",
            "is_active",
            "display_order",
        )
        read_only_fields = ("id",)

    def validate_quantity(self, value: int) -> int:
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")

        return value