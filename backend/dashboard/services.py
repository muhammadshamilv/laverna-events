from django.db.models import Count, Sum
from django.utils import timezone
from guests.models import Guest
from invitations.models import InvitationSend
from notifications.models import NotificationLog


class DashboardError(Exception):
    """Raised when dashboard data cannot be computed."""

    def __init__(self, message: str, code: str = "dashboard_error"):
        self.message = message
        self.code = code
        super().__init__(message)


def get_event_dashboard_stats(event) -> dict:
    """Compute all dashboard statistics for a single event.

    Expected attendance is calculated as:
        SUM(family_member_count) for guests with response_status = ACCEPTED
    """

    guests = Guest.objects.filter(event=event)

    total_guests = guests.count()

    response_counts = dict(
        guests.values_list("response_status").annotate(count=Count("id"))
    )

    accepted_count = response_counts.get(Guest.ResponseStatus.ACCEPTED, 0)
    rejected_count = response_counts.get(Guest.ResponseStatus.REJECTED, 0)
    maybe_count = response_counts.get(Guest.ResponseStatus.MAYBE, 0)
    pending_count = response_counts.get(Guest.ResponseStatus.PENDING, 0)

    invitation_counts = dict(
        guests.values_list("invitation_status").annotate(count=Count("id"))
    )

    invitations_sent = invitation_counts.get(Guest.InvitationStatus.SENT, 0)
    invitations_not_sent = invitation_counts.get(Guest.InvitationStatus.NOT_SENT, 0)
    invitations_failed = invitation_counts.get(Guest.InvitationStatus.FAILED, 0)

    expected_attendance = (
        guests.filter(response_status=Guest.ResponseStatus.ACCEPTED).aggregate(
            total=Sum("family_member_count")
        )["total"]
        or 0
    )

    notifications_sent = NotificationLog.objects.filter(
        invitation__event=event,
        status=NotificationLog.Status.SENT,
    ).count()

    notifications_by_channel = dict(
        NotificationLog.objects.filter(invitation__event=event)
        .values_list("channel")
        .annotate(count=Count("id"))
    )

    return {
        "total_guests": total_guests,
        "accepted_count": accepted_count,
        "rejected_count": rejected_count,
        "maybe_count": maybe_count,
        "pending_count": pending_count,
        "invitations_sent": invitations_sent,
        "invitations_not_sent": invitations_not_sent,
        "invitations_failed": invitations_failed,
        "notifications_sent": notifications_sent,
        "whatsapp_sent_count": notifications_by_channel.get(
            NotificationLog.Channel.WHATSAPP, 0
        ),
        "email_sent_count": notifications_by_channel.get(
            NotificationLog.Channel.EMAIL, 0
        ),
        "sms_sent_count": notifications_by_channel.get(
            NotificationLog.Channel.SMS, 0
        ),
        "expected_attendance": expected_attendance,
    }


def get_event_response_chart_data(event) -> list:
    """Return guest response counts formatted for a pie/bar chart (Recharts-friendly)."""

    guests = Guest.objects.filter(event=event)

    response_counts = dict(
        guests.values_list("response_status").annotate(count=Count("id"))
    )

    labels = {
        Guest.ResponseStatus.ACCEPTED: "Accepted",
        Guest.ResponseStatus.REJECTED: "Rejected",
        Guest.ResponseStatus.MAYBE: "Maybe",
        Guest.ResponseStatus.PENDING: "Pending",
    }

    return [
        {"name": label, "value": response_counts.get(status_value, 0)}
        for status_value, label in labels.items()
    ]


def get_event_invitation_chart_data(event) -> list:
    """Return invitation send-status counts formatted for a chart."""

    guests = Guest.objects.filter(event=event)

    invitation_counts = dict(
        guests.values_list("invitation_status").annotate(count=Count("id"))
    )

    labels = {
        Guest.InvitationStatus.SENT: "Sent",
        Guest.InvitationStatus.NOT_SENT: "Not Sent",
        Guest.InvitationStatus.FAILED: "Failed",
    }

    return [
        {"name": label, "value": invitation_counts.get(status_value, 0)}
        for status_value, label in labels.items()
    ]


def get_organizer_overview_stats(organizer) -> dict:
    """Compute a high-level summary across ALL of the organizer's events."""

    from events.models import Event

    events = Event.objects.filter(organizer=organizer)

    guests = Guest.objects.filter(event__organizer=organizer)

    total_events = events.count()
    total_guests = guests.count()

    accepted_count = guests.filter(
        response_status=Guest.ResponseStatus.ACCEPTED
    ).count()

    expected_attendance = (
        guests.filter(response_status=Guest.ResponseStatus.ACCEPTED).aggregate(
            total=Sum("family_member_count")
        )["total"]
        or 0
    )

    return {
        "total_events": total_events,
        "total_guests": total_guests,
        "total_accepted": accepted_count,
        "total_expected_attendance": expected_attendance,
    }


# ---------------------------------------------------------------------
# Phase 25: invitation-focused dashboard overhaul
# ---------------------------------------------------------------------

def _empty_channel_totals() -> dict:
    return {
        channel: {"sent": 0, "failed": 0}
        for channel in InvitationSend.Channel.values
    }


def get_organizer_channel_performance(organizer) -> dict:
    """Per-channel send/failure totals across ALL of the organizer's
    events - the data behind the Phase 25 dashboard's channel
    performance chart."""

    totals = _empty_channel_totals()

    rows = (
        InvitationSend.objects.filter(event__organizer=organizer)
        .values("channel", "status")
        .annotate(count=Count("id"))
    )

    for row in rows:
        channel = row["channel"]
        if channel not in totals:
            continue

        if row["status"] == InvitationSend.Status.SENT:
            totals[channel]["sent"] += row["count"]
        elif row["status"] == InvitationSend.Status.FAILED:
            totals[channel]["failed"] += row["count"]

    return totals


def get_events_needing_attention(organizer, limit: int = 5) -> list[dict]:
    """A prioritized list of the organizer's events that need a look:
    events with a low response rate (many PENDING guests relative to
    total) and/or outstanding pending WhatsApp reminders, ranked with
    the most urgent first.

    "Needing attention" here means: has at least one guest, and either
    (a) a pending-response rate of 40% or higher, or (b) at least one
    PendingWhatsAppReminder waiting on the organizer. Events with zero
    guests are skipped (nothing to act on yet), and events are ranked by
    pending-response rate descending, then by pending WhatsApp reminder
    count descending.
    """

    from events.models import Event
    from invitations.models import PendingWhatsAppReminder

    events = Event.objects.filter(organizer=organizer).exclude(
        status=Event.Status.CANCELLED
    )

    pending_reminder_counts = dict(
        PendingWhatsAppReminder.objects.filter(event__organizer=organizer)
        .values_list("event_id")
        .annotate(count=Count("id"))
    )

    results = []

    for event in events:
        guests = Guest.objects.filter(event=event)
        total_guests = guests.count()

        if total_guests == 0:
            continue

        pending_count = guests.filter(response_status=Guest.ResponseStatus.PENDING).count()
        pending_rate = pending_count / total_guests
        reminder_count = pending_reminder_counts.get(event.id, 0)

        needs_attention = pending_rate >= 0.4 or reminder_count > 0

        if not needs_attention:
            continue

        results.append(
            {
                "event_id": event.id,
                "event_name": event.name,
                "event_date": event.event_date,
                "total_guests": total_guests,
                "pending_count": pending_count,
                "pending_rate": round(pending_rate, 2),
                "pending_whatsapp_reminders": reminder_count,
            }
        )

    results.sort(key=lambda row: (row["pending_rate"], row["pending_whatsapp_reminders"]), reverse=True)

    return results[:limit]


def get_organizer_quota_usage(organizer) -> dict | None:
    """Return the organizer's current subscription quota usage, or None
    if they have no active subscription.

    Mirrors the shape membership/UsageOverview.tsx already renders
    elsewhere in the app, so the dashboard's quota tile can reuse the
    exact same numbers rather than inventing a second representation.
    """

    from memberships.utils import get_active_subscription

    subscription = get_active_subscription(organizer)

    if subscription is None:
        return None

    plan = subscription.plan

    return {
        "plan_name": plan.name,
        "invitations_used": subscription.invitations_used,
        "invitations_total": plan.total_invitations,
        "invitations_remaining": subscription.invitations_remaining(),
        "voice_calls_used": subscription.voice_calls_used,
        "voice_calls_total": plan.voice_call_limit,
        "voice_calls_remaining": subscription.voice_calls_remaining(),
        "expires_at": subscription.expires_at,
    }


def get_organizer_invitation_overview(organizer) -> dict:
    """Assemble the full Phase 25 dashboard payload: the existing
    cross-event overview stats, plus channel performance, events needing
    attention, and quota usage - all in one call so the dashboard page
    makes a single request rather than four."""

    overview_stats = get_organizer_overview_stats(organizer)

    pending_whatsapp_total = 0
    try:
        from invitations.models import PendingWhatsAppReminder

        pending_whatsapp_total = PendingWhatsAppReminder.objects.filter(
            event__organizer=organizer
        ).count()
    except Exception:
        pending_whatsapp_total = 0

    return {
        **overview_stats,
        "pending_whatsapp_reminders": pending_whatsapp_total,
        "channel_performance": get_organizer_channel_performance(organizer),
        "events_needing_attention": get_events_needing_attention(organizer),
        "quota_usage": get_organizer_quota_usage(organizer),
        "generated_at": timezone.now(),
    }