from django.urls import path

from .views import (
    EventQRCodePDFView,
    EventQRCodePNGView,
    EventQRCodeView,
    GuestSelfieMatchView,
    ScannedEventView,
)

urlpatterns = [
    # Organizer-only management endpoints.
    path("events/<int:event_pk>/qr-code/", EventQRCodeView.as_view(), name="event-qr-code"),
    path("events/<int:event_pk>/qr-code/png/", EventQRCodePNGView.as_view(), name="event-qr-code-png"),
    path("events/<int:event_pk>/qr-code/pdf/", EventQRCodePDFView.as_view(), name="event-qr-code-pdf"),
    # Public, no-login guest-facing endpoints - deliberately under a
    # separate /qr/ prefix rather than nested under /events/<id>/, since
    # a guest identifies the event only by its opaque token, never by
    # its numeric id.
    path("qr/<uuid:token>/", ScannedEventView.as_view(), name="scanned-event"),
    path("qr/<uuid:token>/selfie/", GuestSelfieMatchView.as_view(), name="guest-selfie-match"),
]
