"""Phase 24: end-of-process invitation report.

Pulls together Invitation/InvitationSend/NotificationLog/Guest data into
one report structure covering: send totals by channel (first sends vs
reminders), RSVP totals (by guest count and by headcount via
family_member_count), the same two broken down per GuestCategory, and a
full per-guest detail log. Read-only - this module only aggregates
existing data, it doesn't create or change any records.
"""

from django.db.models import Count, Q, Sum

from guests.models import Guest
from invitations.models import InvitationSend


def _empty_channel_totals() -> dict:
    return {
        channel: {"sent": 0, "failed": 0, "reminders_sent": 0}
        for channel in InvitationSend.Channel.values
    }


def build_send_summary(event) -> dict:
    """Per-channel totals: first sends (sent/failed) and reminders sent,
    for this event as a whole."""

    totals = _empty_channel_totals()

    rows = (
        InvitationSend.objects.filter(event=event)
        .values("channel", "is_reminder", "status")
        .annotate(count=Count("id"))
    )

    for row in rows:
        channel = row["channel"]
        if channel not in totals:
            continue

        if row["is_reminder"]:
            if row["status"] == InvitationSend.Status.SENT:
                totals[channel]["reminders_sent"] += row["count"]
        else:
            if row["status"] == InvitationSend.Status.SENT:
                totals[channel]["sent"] += row["count"]
            elif row["status"] == InvitationSend.Status.FAILED:
                totals[channel]["failed"] += row["count"]

    return totals


def _empty_rsvp_totals() -> dict:
    return {
        status: {"guests": 0, "headcount": 0} for status in Guest.ResponseStatus.values
    }


def build_rsvp_summary(guests_queryset) -> dict:
    """RSVP totals for a given guest queryset: guest counts AND headcount
    (sum of family_member_count) per response status."""

    totals = _empty_rsvp_totals()

    rows = (
        guests_queryset.values("response_status")
        .annotate(guest_count=Count("id"), headcount=Sum("family_member_count"))
    )

    for row in rows:
        response_status = row["response_status"]
        if response_status not in totals:
            continue

        totals[response_status]["guests"] = row["guest_count"]
        totals[response_status]["headcount"] = row["headcount"] or 0

    return totals


def build_category_breakdown(event) -> list[dict]:
    """Per-category breakdown of both send totals and RSVP totals,
    including an "Uncategorized" bucket for guests with no category."""

    from guests.models import GuestCategory

    breakdown = []

    categories = list(GuestCategory.objects.filter(event=event).order_by("display_order", "name"))

    for category in categories:
        guests_qs = Guest.objects.filter(event=event, category=category)

        send_rows = (
            InvitationSend.objects.filter(event=event, guest__category=category)
            .values("channel", "is_reminder", "status")
            .annotate(count=Count("id"))
        )

        send_totals = _empty_channel_totals()
        for row in send_rows:
            channel = row["channel"]
            if channel not in send_totals:
                continue
            if row["is_reminder"]:
                if row["status"] == InvitationSend.Status.SENT:
                    send_totals[channel]["reminders_sent"] += row["count"]
            else:
                if row["status"] == InvitationSend.Status.SENT:
                    send_totals[channel]["sent"] += row["count"]
                elif row["status"] == InvitationSend.Status.FAILED:
                    send_totals[channel]["failed"] += row["count"]

        breakdown.append(
            {
                "category_id": category.id,
                "category_name": category.name,
                "send_summary": send_totals,
                "rsvp_summary": build_rsvp_summary(guests_qs),
            }
        )

    uncategorized_guests_qs = Guest.objects.filter(event=event, category__isnull=True)

    if uncategorized_guests_qs.exists():
        send_rows = (
            InvitationSend.objects.filter(event=event, guest__category__isnull=True)
            .values("channel", "is_reminder", "status")
            .annotate(count=Count("id"))
        )

        send_totals = _empty_channel_totals()
        for row in send_rows:
            channel = row["channel"]
            if channel not in send_totals:
                continue
            if row["is_reminder"]:
                if row["status"] == InvitationSend.Status.SENT:
                    send_totals[channel]["reminders_sent"] += row["count"]
            else:
                if row["status"] == InvitationSend.Status.SENT:
                    send_totals[channel]["sent"] += row["count"]
                elif row["status"] == InvitationSend.Status.FAILED:
                    send_totals[channel]["failed"] += row["count"]

        breakdown.append(
            {
                "category_id": None,
                "category_name": "Uncategorized",
                "send_summary": send_totals,
                "rsvp_summary": build_rsvp_summary(uncategorized_guests_qs),
            }
        )

    return breakdown


def build_guest_detail_rows(event) -> list[dict]:
    """One row per guest: invitation status, response status, channel(s)
    used, and total reminders sent (manual + automatic combined - see
    module docstring)."""

    guests = (
        Guest.objects.filter(event=event)
        .select_related("category")
        .order_by("name")
    )

    reminder_counts = dict(
        InvitationSend.objects.filter(event=event, is_reminder=True, status=InvitationSend.Status.SENT)
        .values("guest_id")
        .annotate(count=Count("id"))
        .values_list("guest_id", "count")
    )

    # A guest may have sent attempts across more than one channel
    # (e.g. retried on a different channel) - collect the distinct set
    # actually used (status=SENT) rather than assuming one.
    channels_used = {}
    for row in (
        InvitationSend.objects.filter(event=event, status=InvitationSend.Status.SENT)
        .values_list("guest_id", "channel")
        .distinct()
    ):
        guest_id, channel = row
        channels_used.setdefault(guest_id, []).append(channel)

    rows = []
    for guest in guests:
        rows.append(
            {
                "guest_id": guest.id,
                "guest_name": guest.name,
                "category_name": guest.category.name if guest.category else None,
                "family_member_count": guest.family_member_count,
                "invitation_status": guest.invitation_status,
                "response_status": guest.response_status,
                "channels_used": channels_used.get(guest.id, []),
                "reminders_sent": reminder_counts.get(guest.id, 0),
            }
        )

    return rows


def build_full_report(event) -> dict:
    """Assemble the complete Phase 24 report for one event."""

    all_guests_qs = Guest.objects.filter(event=event)

    return {
        "event_id": event.id,
        "event_name": event.name,
        "total_guests": all_guests_qs.count(),
        "total_expected_headcount": all_guests_qs.aggregate(total=Sum("family_member_count"))["total"] or 0,
        "send_summary": build_send_summary(event),
        "rsvp_summary": build_rsvp_summary(all_guests_qs),
        "category_breakdown": build_category_breakdown(event),
        "guest_details": build_guest_detail_rows(event),
    }