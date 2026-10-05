from django.urls import path

from .views import (
    EventChartsView,
    EventDashboardView,
    OrganizerInvitationDashboardView,
    OrganizerOverviewView,
)


urlpatterns = [
    path(
        "overview/",
        OrganizerOverviewView.as_view(),
        name="organizer-overview",
    ),
    path(
        "invitation-overview/",
        OrganizerInvitationDashboardView.as_view(),
        name="organizer-invitation-overview",
    ),
    path(
        "events/<int:event_pk>/dashboard/",
        EventDashboardView.as_view(),
        name="event-dashboard",
    ),
    path(
        "events/<int:event_pk>/dashboard/charts/",
        EventChartsView.as_view(),
        name="event-dashboard-charts",
    ),
]