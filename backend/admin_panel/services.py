from datetime import timedelta

from django.db import transaction
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone

from events.models import Event
from gallery.models import GalleryMedia
from memberships.models import MembershipPlan, Subscription
from memberships.topup_models import PlatformChannelPool, PlatformPoolTopup, TopupPurchase
from payments.models import Payment
from users.models import User


class AdminError(Exception):
    """Raised when an admin action cannot be completed."""

    def __init__(self, message: str, code: str = "admin_error"):
        self.message = message
        self.code = code
        super().__init__(message)


# --------------------------------------------------
# Dashboard
# --------------------------------------------------

def get_storage_usage_mb() -> float:
    """Sum file_size (bytes) across all gallery media, in megabytes.

    Rows uploaded before Phase 14 have file_size=None and are treated as
    0 bytes (Sum() already skips NULLs) rather than requiring a backfill
    migration that re-reads every file from disk.
    """

    total_bytes = GalleryMedia.objects.aggregate(
        total=Sum("file_size")
    )["total"] or 0

    return round(total_bytes / (1024 * 1024), 2)


def get_channel_usage() -> list[dict]:
    """Usage snapshot of every CONFIGURED platform channel pool.

    A channel with no pool row has never been topped up and is unlimited,
    so there is nothing to monitor for it and it is left out here.
    """

    pools = PlatformChannelPool.objects.all().order_by("channel")

    return [
        {
            "channel": pool.channel,
            "channel_display": pool.get_channel_display(),
            "total_capacity": pool.total_capacity,
            "used": pool.used,
            "remaining": pool.remaining(),
            "is_low": pool.is_low(),
            "is_exhausted": pool.is_exhausted(),
        }
        for pool in pools
    ]


def get_dashboard_stats() -> dict:
    """Aggregate the top-line numbers for the admin dashboard.

    Phase 26: revenue now includes paid topup-pack purchases alongside
    plan payments, and the response carries the platform channel pool
    usage snapshot. membership_sales still counts plan payments only.
    """

    total_users = User.objects.count()

    active_events = Event.objects.filter(
        status=Event.Status.PUBLISHED
    ).count()

    paid_plans = Payment.objects.filter(status=Payment.Status.PAID)
    paid_topups = TopupPurchase.objects.filter(status=TopupPurchase.Status.PAID)

    membership_sales = paid_plans.count()

    plan_revenue = paid_plans.aggregate(total=Sum("amount"))["total"] or 0
    topup_revenue = paid_topups.aggregate(total=Sum("amount"))["total"] or 0

    return {
        "total_users": total_users,
        "active_events": active_events,
        "membership_sales": membership_sales,
        "revenue": plan_revenue + topup_revenue,
        "storage_usage_mb": get_storage_usage_mb(),
        "channel_usage": get_channel_usage(),
    }


# --------------------------------------------------
# User Management
# --------------------------------------------------

def suspend_user(user: User) -> User:
    """Block a user from logging in (UserLoginSerializer enforces this)."""

    user.is_suspended = True
    user.save(update_fields=["is_suspended", "updated_at"])

    return user


def unsuspend_user(user: User) -> User:
    """Restore a suspended user's ability to log in."""

    user.is_suspended = False
    user.save(update_fields=["is_suspended", "updated_at"])

    return user


def delete_user(user: User) -> None:
    """Permanently delete a user account."""

    user.delete()


# --------------------------------------------------
# Reports
# --------------------------------------------------

def _paid_revenue_by_day(model, since) -> dict:
    """{date: summed amount} of PAID rows for a payment-like model."""

    rows = (
        model.objects.filter(status=model.Status.PAID, created_at__gte=since)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(amount=Sum("amount"))
        .order_by("day")
    )

    return {row["day"]: row["amount"] for row in rows if row["day"] is not None}


def get_revenue_by_day(days: int = 30) -> list[dict]:
    """Daily revenue totals for the last `days` days, PAID plan payments
    and PAID topup purchases combined."""

    since = timezone.now() - timedelta(days=days)

    combined: dict = {}

    for source in (
        _paid_revenue_by_day(Payment, since),
        _paid_revenue_by_day(TopupPurchase, since),
    ):
        for day, amount in source.items():
            combined[day] = combined.get(day, 0) + amount

    return [
        {"period": day.isoformat(), "amount": amount}
        for day, amount in sorted(combined.items())
    ]


def get_registrations_by_day(days: int = 30) -> list[dict]:
    """Daily new-user-registration counts for the last `days` days."""

    since = timezone.now() - timedelta(days=days)

    rows = (
        User.objects.filter(created_at__gte=since)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )

    return [
        {"period": row["day"].isoformat(), "count": row["count"]}
        for row in rows
        if row["day"] is not None
    ]


def get_membership_statistics() -> list[dict]:
    """Active subscriber count per membership plan."""

    rows = (
        MembershipPlan.objects.annotate(
            active_subscribers=Count(
                "subscriptions",
                filter=Q(subscriptions__status=Subscription.Status.ACTIVE),
            )
        )
        .order_by("display_order", "price")
        .values("name", "active_subscribers")
    )

    return [
        {"plan_name": row["name"], "active_subscribers": row["active_subscribers"]}
        for row in rows
    ]


def get_reports() -> dict:
    """Assemble the full Reports payload: Revenue, Registrations, Active
    Events, Membership Statistics, Storage Usage."""

    return {
        "revenue_by_period": get_revenue_by_day(),
        "registrations_by_period": get_registrations_by_day(),
        "active_events_count": Event.objects.filter(
            status=Event.Status.PUBLISHED
        ).count(),
        "membership_statistics": get_membership_statistics(),
        "storage_usage_mb": get_storage_usage_mb(),
    }


# --------------------------------------------------
# Phase 26: platform channel pool management
# --------------------------------------------------

def list_channel_pools() -> list[PlatformChannelPool]:
    """Every channel's pool, in a stable order, for the admin page.

    A channel that has never been topped up has no database row. It is
    returned as an UNSAVED placeholder so the admin can see it and top it
    up, but nothing is written here: creating a zero-capacity row on a
    plain page view would make that channel read as exhausted and
    hard-block every send on it. An unsaved placeholder is reported as
    "not configured" by the serializer instead.
    """

    existing = {pool.channel: pool for pool in PlatformChannelPool.objects.all()}

    return [
        existing.get(value) or PlatformChannelPool(channel=value)
        for value, _label in PlatformChannelPool.Channel.choices
    ]


@transaction.atomic
def topup_channel_pool(channel: str, amount: int, note: str, admin_user: User) -> PlatformChannelPool:
    """Increase a platform channel pool's total capacity and record the
    topup in the audit trail (PlatformPoolTopup).

    The first topup for a channel creates its pool row.
    """

    from django.db.models import F

    pool, _created = PlatformChannelPool.objects.get_or_create(channel=channel)

    PlatformChannelPool.objects.filter(pk=pool.pk).update(
        total_capacity=F("total_capacity") + amount,
        updated_at=timezone.now(),
    )

    pool.refresh_from_db()

    PlatformPoolTopup.objects.create(
        pool=pool,
        amount=amount,
        note=note,
        topped_up_by=admin_user,
    )

    return pool


def get_pool_topup_history(channel: str | None = None, limit: int = 50) -> list[PlatformPoolTopup]:
    """Most recent topup audit records, optionally filtered by channel."""

    queryset = (
        PlatformPoolTopup.objects.select_related("pool", "topped_up_by")
        .order_by("-created_at")
    )

    if channel:
        queryset = queryset.filter(pool__channel=channel)

    return list(queryset[:limit])