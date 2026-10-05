from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MembershipPlan
from .topup_models import TopupPack
from .serializers import (
    ChangePlanSerializer,
    MembershipPlanSerializer,
    MyUsageSerializer,
    SubscribeSerializer,
    SubscriptionSerializer,
    TopupPackSerializer,
)
from .services import (
    SubscriptionError,
    change_user_plan,
    get_active_subscription,
    get_organizer_template_count,
    subscribe_user_to_plan,
)
from .utils import get_effective_plan


class MembershipPlanListView(ListAPIView):
    """List all active membership plans, ordered for the public pricing page."""

    serializer_class = MembershipPlanSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        """Return only active plans."""

        return MembershipPlan.objects.filter(
            is_active=True
        ).order_by("display_order", "price")

    def list(self, request, *args, **kwargs):
        """Return plans wrapped in the project's consistent response format."""

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return Response(
            {
                "success": True,
                "message": "Membership plans retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class MembershipPlanDetailView(APIView):
    """Retrieve a single active membership plan by its slug."""

    permission_classes = [AllowAny]

    def get(self, request, slug):
        """Return plan details for the given slug."""

        plan = MembershipPlan.objects.filter(
            slug=slug,
            is_active=True,
        ).first()

        if plan is None:
            return Response(
                {
                    "success": False,
                    "message": "Membership plan not found.",
                    "errors": {
                        "plan": [
                            "No active plan found with this slug."
                        ]
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = MembershipPlanSerializer(plan)

        return Response(
            {
                "success": True,
                "message": "Membership plan retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class MySubscriptionView(APIView):
    """Retrieve the authenticated user's current active subscription."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return the logged-in user's active subscription, if any."""

        subscription = get_active_subscription(request.user)

        if subscription is None:
            return Response(
                {
                    "success": True,
                    "message": "No active subscription found.",
                    "data": None,
                },
                status=status.HTTP_200_OK,
            )

        serializer = SubscriptionSerializer(subscription)

        return Response(
            {
                "success": True,
                "message": "Active subscription retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class SubscribeView(APIView):
    """Subscribe the authenticated user to a membership plan."""

    permission_classes = [IsAuthenticated]

    ERROR_STATUS_MAP = {
        "plan_not_found": status.HTTP_404_NOT_FOUND,
        "already_subscribed": status.HTTP_409_CONFLICT,
        "payment_required": status.HTTP_402_PAYMENT_REQUIRED,
    }

    def post(self, request):
        """Create a new active subscription for the logged-in user."""

        serializer = SubscribeSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Invalid request.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan_slug = serializer.validated_data["plan_slug"]

        try:
            subscription = subscribe_user_to_plan(
                user=request.user,
                plan_slug=plan_slug,
            )

        except SubscriptionError as error:
            response_status = self.ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"plan_slug": [error.message]},
                },
                status=response_status,
            )

        response_serializer = SubscriptionSerializer(subscription)

        return Response(
            {
                "success": True,
                "message": "Subscribed successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class ChangePlanView(APIView):
    """Upgrade or downgrade the authenticated user's active subscription."""

    permission_classes = [IsAuthenticated]

    ERROR_STATUS_MAP = {
        "plan_not_found": status.HTTP_404_NOT_FOUND,
        "no_active_subscription": status.HTTP_409_CONFLICT,
        "same_plan": status.HTTP_409_CONFLICT,
        "payment_required": status.HTTP_402_PAYMENT_REQUIRED,
    }

    def post(self, request):
        """Cancel the current subscription and start a new one on the given plan."""

        serializer = ChangePlanSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Invalid request.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan_slug = serializer.validated_data["plan_slug"]

        try:
            new_subscription, change_type = change_user_plan(
                user=request.user,
                new_plan_slug=plan_slug,
            )

        except SubscriptionError as error:
            response_status = self.ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"plan_slug": [error.message]},
                },
                status=response_status,
            )

        response_serializer = SubscriptionSerializer(new_subscription)

        return Response(
            {
                "success": True,
                "message": f"Plan {change_type} completed successfully.",
                "data": {
                    "change_type": change_type,
                    "subscription": response_serializer.data,
                },
            },
            status=status.HTTP_200_OK,
        )


class MyUsageView(APIView):
    """Return the authenticated user's plan limits and feature access.

    Phase 17: template_limit usage now reports the organizer's actual
    OrganizerTemplateLibrary count (template_count / template_remaining)
    instead of a static plan field, since template_limit is a count the
    organizer consumes by adding templates to their library - mirroring
    how invitations_used/invitations_remaining already work for the
    shared invitation pool.

    Phase 26: added invitations_topup/voice_calls_topup, reporting how
    much of the organizer's current remaining quota came from a topup
    purchase on top of their plan's base limit.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return the logged-in user's effective plan limits and usage."""

        plan = get_effective_plan(request.user)

        if plan is None:
            data = {
                "plan_name": "No active plan",
                "has_active_plan": False,
                "guest_limit": None,
                "event_limit": None,
                "template_limit": None,
                "template_count": None,
                "template_remaining": None,
                "storage_limit_mb": None,
                "total_invitations": None,
                "invitations_used": None,
                "invitations_topup": None,
                "invitations_remaining": None,
                "voice_call_limit": None,
                "voice_calls_used": None,
                "voice_calls_topup": None,
                "voice_calls_remaining": None,
                "gallery_enabled": False,
                "qr_code_enabled": False,
                "photographer_access_enabled": False,
            }
        else:
            subscription = get_active_subscription(request.user)
            template_count = get_organizer_template_count(request.user)

            template_remaining = (
                None
                if plan.template_limit is None
                else max(plan.template_limit - template_count, 0)
            )

            data = {
                "plan_name": plan.name,
                "has_active_plan": True,
                "guest_limit": plan.guest_limit,
                "event_limit": plan.event_limit,
                "template_limit": plan.template_limit,
                "template_count": template_count,
                "template_remaining": template_remaining,
                "storage_limit_mb": plan.storage_limit_mb,
                "total_invitations": plan.total_invitations,
                "invitations_used": subscription.invitations_used if subscription else 0,
                "invitations_topup": subscription.invitations_topup if subscription else 0,
                "invitations_remaining": (
                    subscription.invitations_remaining() if subscription else plan.total_invitations
                ),
                "voice_call_limit": plan.voice_call_limit,
                "voice_calls_used": subscription.voice_calls_used if subscription else 0,
                "voice_calls_topup": subscription.voice_calls_topup if subscription else 0,
                "voice_calls_remaining": (
                    subscription.voice_calls_remaining() if subscription else plan.voice_call_limit
                ),
                "gallery_enabled": plan.gallery_enabled,
                "qr_code_enabled": plan.qr_code_enabled,
                "photographer_access_enabled": plan.photographer_access_enabled,
            }

        serializer = MyUsageSerializer(data)

        return Response(
            {
                "success": True,
                "message": "Usage summary retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class PortalAccessView(APIView):
    """Check whether the authenticated user may enter the organizer portal.

    Requires both: verified email AND an active (paid or free) subscription.
    Intended to be called by the frontend right after login/payment to
    decide whether to route the user into the dashboard or back to an
    onboarding step (verify email / choose a plan / pay).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return whether the user can access the portal, and which step is blocking them."""

        user = request.user

        if not user.is_verified:
            return Response(
                {
                    "success": True,
                    "message": "Email verification required.",
                    "data": {
                        "can_access_portal": False,
                        "next_step": "verify_mobile",
                    },
                },
                status=status.HTTP_200_OK,
            )

        subscription = get_active_subscription(user)

        if subscription is None:
            return Response(
                {
                    "success": True,
                    "message": "An active membership plan is required.",
                    "data": {
                        "can_access_portal": False,
                        "next_step": "select_plan",
                    },
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "success": True,
                "message": "Portal access granted.",
                "data": {
                    "can_access_portal": True,
                    "next_step": None,
                },
            },
            status=status.HTTP_200_OK,
        )


class TopupPackListView(ListAPIView):
    """Phase 26: list all active topup packs available for organizers to buy."""

    serializer_class = TopupPackSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return TopupPack.objects.filter(is_active=True).order_by("display_order", "price")

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)

        return Response(
            {
                "success": True,
                "message": "Topup packs retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )