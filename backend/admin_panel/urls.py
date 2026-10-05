from django.urls import path

from .views import (
    AdminChannelPoolListView,
    AdminChannelPoolTopupHistoryView,
    AdminChannelPoolTopupView,
    AdminDashboardStatsView,
    AdminGalleryMediaDeleteView,
    AdminGalleryMediaListView,
    AdminInvitationTemplateDetailView,
    AdminInvitationTemplateListCreateView,
    AdminMembershipPlanDetailView,
    AdminMembershipPlanListCreateView,
    AdminReportsView,
    AdminTopupPackDetailView,
    AdminTopupPackListCreateView,
    AdminUserDetailView,
    AdminUserListView,
    AdminUserSuspendView,
    AdminUserUnsuspendView,
)


urlpatterns = [
    path("dashboard/", AdminDashboardStatsView.as_view(), name="admin-dashboard"),

    path("users/", AdminUserListView.as_view(), name="admin-user-list"),
    path("users/<int:user_pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("users/<int:user_pk>/suspend/", AdminUserSuspendView.as_view(), name="admin-user-suspend"),
    path("users/<int:user_pk>/unsuspend/", AdminUserUnsuspendView.as_view(), name="admin-user-unsuspend"),

    path("plans/", AdminMembershipPlanListCreateView.as_view(), name="admin-plan-list-create"),
    path("plans/<int:plan_pk>/", AdminMembershipPlanDetailView.as_view(), name="admin-plan-detail"),

    path("templates/", AdminInvitationTemplateListCreateView.as_view(), name="admin-template-list-create"),
    path("templates/<int:template_pk>/", AdminInvitationTemplateDetailView.as_view(), name="admin-template-detail"),

    path("media/", AdminGalleryMediaListView.as_view(), name="admin-media-list"),
    path("media/<int:media_pk>/", AdminGalleryMediaDeleteView.as_view(), name="admin-media-delete"),

    path("reports/", AdminReportsView.as_view(), name="admin-reports"),

    # Phase 26: platform channel pools
    path("channel-pools/", AdminChannelPoolListView.as_view(), name="admin-channel-pool-list"),
    path("channel-pools/topup/", AdminChannelPoolTopupView.as_view(), name="admin-channel-pool-topup"),
    path("channel-pools/topup-history/", AdminChannelPoolTopupHistoryView.as_view(), name="admin-channel-pool-topup-history"),

    # Phase 26: topup pack administration
    path("topup-packs/", AdminTopupPackListCreateView.as_view(), name="admin-topup-pack-list-create"),
    path("topup-packs/<int:pack_pk>/", AdminTopupPackDetailView.as_view(), name="admin-topup-pack-detail"),
]