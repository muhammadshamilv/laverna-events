from django.urls import path

from .views import (
    EventPhotographerAccessView,
    MyPhotographerEventsView,
    RevokePhotographerAccessView,
)


urlpatterns = [
    # Organizer-side: manage who has photographer access to one event.
    path(
        "events/<int:event_pk>/photographer-access/",
        EventPhotographerAccessView.as_view(),
        name="event-photographer-access",
    ),
    path(
        "events/<int:event_pk>/photographer-access/<int:grant_pk>/revoke/",
        RevokePhotographerAccessView.as_view(),
        name="revoke-photographer-access",
    ),
    # Photographer-side: see the events I've been granted access to.
    path(
        "photographer/my-events/",
        MyPhotographerEventsView.as_view(),
        name="my-photographer-events",
    ),
]
