from common.permissions import IsAdminRole
from django.shortcuts import get_object_or_404
from events.models import Event
from gallery.models import GalleryMedia
from gallery.services import delete_media
from invitations.models import InvitationTemplate
from memberships.models import MembershipPlan
from memberships.topup_models import TopupPack
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import User

from .serializers import (
    AdminDashboardStatsSerializer,
    AdminGalleryMediaSerializer,
    AdminInvitationTemplateSerializer,
    AdminMembershipPlanSerializer,
    AdminReportsSerializer,
    AdminTopupPackSerializer,
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
    PlatformChannelPoolSerializer,
    PlatformPoolTopupCreateSerializer,
    PlatformPoolTopupSerializer,
)
from .services import (
    get_dashboard_stats,
    get_pool_topup_history,
    get_reports,
    list_channel_pools,
    suspend_user,
    topup_channel_pool,
    unsuspend_user,
)


# --------------------------------------------------
# Dashboard
# --------------------------------------------------

class AdminDashboardStatsView(APIView):
    """Admin Dashboard: Total Users, Active Events, Membership Sales,
    Revenue, Storage Usage, and (Phase 26) platform channel capacity."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        stats = get_dashboard_stats()
        serializer = AdminDashboardStatsSerializer(stats)

        return Response(
            {
                "success": True,
                "message": "Dashboard stats retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------------------
# User Management
# --------------------------------------------------

class AdminUserListView(ListAPIView):
    """View Users: list every user, with search and role/status filters."""

    serializer_class = AdminUserListSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    filterset_fields = ["role", "is_active", "is_suspended", "is_verified"]
    search_fields = ["full_name", "email", "mobile_number"]

    def get_queryset(self):
        return User.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(full_name__icontains=search) | queryset.filter(
                email__icontains=search
            ) | queryset.filter(mobile_number__icontains=search)

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)

        return Response(
            {
                "success": True,
                "message": "Users retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminUserDetailView(APIView):
    """View/Edit/Delete a single user."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, user_pk):
        user = get_object_or_404(User, pk=user_pk)
        serializer = AdminUserListSerializer(user)

        return Response(
            {
                "success": True,
                "message": "User retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, user_pk):
        user = get_object_or_404(User, pk=user_pk)

        serializer = AdminUserUpdateSerializer(
            user, data=request.data, partial=True
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "User update failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(
            {
                "success": True,
                "message": "User updated successfully.",
                "data": AdminUserListSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, user_pk):
        user = get_object_or_404(User, pk=user_pk)
        user.delete()

        return Response(
            {
                "success": True,
                "message": "User deleted successfully.",
                "data": {},
            },
            status=status.HTTP_200_OK,
        )


class AdminUserSuspendView(APIView):
    """Suspend Users: block login without deleting the account."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, user_pk):
        user = get_object_or_404(User, pk=user_pk)
        user = suspend_user(user)

        return Response(
            {
                "success": True,
                "message": "User suspended successfully.",
                "data": AdminUserListSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class AdminUserUnsuspendView(APIView):
    """Reverse a suspension."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, user_pk):
        user = get_object_or_404(User, pk=user_pk)
        user = unsuspend_user(user)

        return Response(
            {
                "success": True,
                "message": "User unsuspended successfully.",
                "data": AdminUserListSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------------------
# Membership Management
# --------------------------------------------------

class AdminMembershipPlanListCreateView(ListAPIView):
    """Create Plans / list all plans (including inactive ones, unlike the
    public MembershipPlanListView)."""

    serializer_class = AdminMembershipPlanSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    pagination_class = None

    def get_queryset(self):
        return MembershipPlan.objects.all().order_by("display_order", "price")

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)

        return Response(
            {
                "success": True,
                "message": "Membership plans retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = AdminMembershipPlanSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Plan creation failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        plan = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Plan created successfully.",
                "data": AdminMembershipPlanSerializer(plan).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminMembershipPlanDetailView(APIView):
    """Edit Plans / Delete Plans."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, plan_pk):
        plan = get_object_or_404(MembershipPlan, pk=plan_pk)

        serializer = AdminMembershipPlanSerializer(
            plan, data=request.data, partial=True
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Plan update failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Plan updated successfully.",
                "data": AdminMembershipPlanSerializer(plan).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, plan_pk):
        plan = get_object_or_404(MembershipPlan, pk=plan_pk)
        plan.delete()

        return Response(
            {
                "success": True,
                "message": "Plan deleted successfully.",
                "data": {},
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------------------
# Invitation Templates
# --------------------------------------------------

class AdminInvitationTemplateListCreateView(ListAPIView):
    """Add Templates / list all templates (including inactive ones)."""

    serializer_class = AdminInvitationTemplateSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = None

    def get_queryset(self):
        return InvitationTemplate.objects.all().order_by("display_order", "name")

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)

        return Response(
            {
                "success": True,
                "message": "Invitation templates retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = AdminInvitationTemplateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Template creation failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        template = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Template created successfully.",
                "data": AdminInvitationTemplateSerializer(template).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminInvitationTemplateDetailView(APIView):
    """Edit Templates / Delete Templates."""

    permission_classes = [IsAuthenticated, IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, template_pk):
        template = get_object_or_404(InvitationTemplate, pk=template_pk)

        serializer = AdminInvitationTemplateSerializer(
            template, data=request.data, partial=True
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Template update failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Template updated successfully.",
                "data": AdminInvitationTemplateSerializer(template).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, template_pk):
        template = get_object_or_404(InvitationTemplate, pk=template_pk)
        template.delete()

        return Response(
            {
                "success": True,
                "message": "Template deleted successfully.",
                "data": {},
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------------------
# Media Management
# --------------------------------------------------

class AdminGalleryMediaListView(ListAPIView):
    """Monitor Storage / Manage Uploads: list all gallery media platform-wide."""

    serializer_class = AdminGalleryMediaSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    filterset_fields = ["media_type", "event"]

    def get_queryset(self):
        return GalleryMedia.objects.select_related("event", "uploaded_by").all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)

        return Response(
            {
                "success": True,
                "message": "Gallery media retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminGalleryMediaDeleteView(APIView):
    """Delete Media: admin can remove any media platform-wide."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def delete(self, request, media_pk):
        media = get_object_or_404(GalleryMedia, pk=media_pk)
        delete_media(media)

        return Response(
            {
                "success": True,
                "message": "Media deleted successfully.",
                "data": {},
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------------------
# Reports
# --------------------------------------------------

class AdminReportsView(APIView):
    """Reports: Revenue, Registrations, Active Events, Membership
    Statistics, Storage Usage."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        data = get_reports()
        serializer = AdminReportsSerializer(data)

        return Response(
            {
                "success": True,
                "message": "Reports retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------------------
# Phase 26: platform channel pools
# --------------------------------------------------

class AdminChannelPoolListView(APIView):
    """List every channel's platform pool, with usage and warning flags."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        serializer = PlatformChannelPoolSerializer(list_channel_pools(), many=True)

        return Response(
            {
                "success": True,
                "message": "Channel pools retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminChannelPoolTopupView(APIView):
    """Top up a platform channel pool's total capacity."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        serializer = PlatformPoolTopupCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Invalid topup request.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        pool = topup_channel_pool(
            channel=serializer.validated_data["channel"],
            amount=serializer.validated_data["amount"],
            note=serializer.validated_data.get("note", ""),
            admin_user=request.user,
        )

        return Response(
            {
                "success": True,
                "message": "Pool topped up successfully.",
                "data": PlatformChannelPoolSerializer(pool).data,
            },
            status=status.HTTP_200_OK,
        )


class AdminChannelPoolTopupHistoryView(APIView):
    """View the topup audit history, optionally filtered by channel."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        channel = request.query_params.get("channel")
        history = get_pool_topup_history(channel=channel)
        serializer = PlatformPoolTopupSerializer(history, many=True)

        return Response(
            {
                "success": True,
                "message": "Topup history retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------------------
# Phase 26: topup pack administration
# --------------------------------------------------

class AdminTopupPackListCreateView(APIView):
    """List all topup packs (including inactive) or create a new one."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        packs = TopupPack.objects.all().order_by("display_order", "price")
        serializer = AdminTopupPackSerializer(packs, many=True)

        return Response(
            {
                "success": True,
                "message": "Topup packs retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = AdminTopupPackSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Topup pack creation failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        pack = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Topup pack created successfully.",
                "data": AdminTopupPackSerializer(pack).data,
            },
            status=status.HTTP_201_CREATED,
        )


class AdminTopupPackDetailView(APIView):
    """Edit a topup pack, or deactivate it (DELETE keeps the row so that
    existing TopupPurchase records still point at a real pack)."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, pack_pk):
        pack = get_object_or_404(TopupPack, pk=pack_pk)

        serializer = AdminTopupPackSerializer(pack, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Topup pack update failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        pack = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Topup pack updated successfully.",
                "data": AdminTopupPackSerializer(pack).data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pack_pk):
        pack = get_object_or_404(TopupPack, pk=pack_pk)
        pack.is_active = False
        pack.save(update_fields=["is_active", "updated_at"])

        return Response(
            {
                "success": True,
                "message": "Topup pack deactivated successfully.",
                "data": AdminTopupPackSerializer(pack).data,
            },
            status=status.HTTP_200_OK,
        )