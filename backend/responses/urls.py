from django.urls import path

from .views import InvitationCalendarView, InvitationResponsePageView


urlpatterns = [
    path(
        "respond/<str:response_token>/",
        InvitationResponsePageView.as_view(),
        name="invitation-response",
    ),
    path(
        "respond/<str:response_token>/calendar/",
        InvitationCalendarView.as_view(),
        name="invitation-calendar",
    ),
]