from django.urls import path

from .views import (
    EventNotificationLogListView,
    MarkWhatsAppSentView,
    RetryNotificationView,
    SendBulkInvitationsView,
    SendInvitationView,
    SendPendingWhatsAppReminderView,
    SendReminderView,
    TwilioCallStatusCallbackView,
    VoiceTwiMLView,
)


urlpatterns = [
    path(
        "events/<int:event_pk>/send-invitation/",
        SendInvitationView.as_view(),
        name="send-invitation",
    ),
    path(
        "events/<int:event_pk>/send-invitations/bulk/",
        SendBulkInvitationsView.as_view(),
        name="send-invitations-bulk",
    ),
    path(
        "notification-logs/<int:log_pk>/mark-whatsapp-sent/",
        MarkWhatsAppSentView.as_view(),
        name="mark-whatsapp-sent",
    ),
    path(
        "notification-logs/<int:log_pk>/retry/",
        RetryNotificationView.as_view(),
        name="retry-notification",
    ),
    path(
        "events/<int:event_pk>/notification-logs/",
        EventNotificationLogListView.as_view(),
        name="event-notification-logs",
    ),
    # Twilio webhooks - called by Twilio's servers, not the frontend.
    path(
        "notifications/voice/twiml/<int:log_pk>/",
        VoiceTwiMLView.as_view(),
        name="voice-twiml",
    ),
    path(
        "notifications/voice/status/<int:log_pk>/",
        TwilioCallStatusCallbackView.as_view(),
        name="voice-status-callback",
    ),
    path(
        "events/<int:event_pk>/send-reminder/",
        SendReminderView.as_view(),
        name="send-reminder",
    ),
    path(
        "pending-whatsapp-reminders/<int:pending_pk>/send/",
        SendPendingWhatsAppReminderView.as_view(),
        name="send-pending-whatsapp-reminder",
    ),
]