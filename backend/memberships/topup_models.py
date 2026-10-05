"""Phase 26: organizer-facing topup packs.

A TopupPack is an admin-defined, fixed-price bundle of extra invitations
or voice calls an organizer can buy on top of their plan's own allowance,
paid via Stripe (same Checkout flow as a plan subscription - see
payments/services.py's create_topup_checkout_session). A TopupPurchase
records one paid purchase and is what actually raises the organizer's
effective quota (via Subscription.invitations_topup /
Subscription.voice_calls_topup - see memberships/models.py's Subscription
and its *_remaining() methods).

Buying a topup does NOT bypass Phase 26's platform-wide channel pools
(see PlatformChannelPool in this same file) - it only raises the
organizer's OWN allowance. Actually sending still checks and decrements
the platform pool for that channel, same as every other send.
"""

from common.models import TimeStampedModel
from django.db import models


class TopupPack(TimeStampedModel):
    """An admin-defined, fixed-price bundle of extra invitations or voice
    calls, purchasable by any organizer regardless of their current plan."""

    class Kind(models.TextChoices):
        INVITATIONS = "INVITATIONS", "Invitations"
        VOICE_CALLS = "VOICE_CALLS", "Voice Calls"

    name = models.CharField(
        max_length=100,
        help_text='Shown to organizers, e.g. "50 Invitations" or "20 Voice Calls".',
    )

    kind = models.CharField(
        max_length=20,
        choices=Kind.choices,
    )

    quantity = models.PositiveIntegerField(
        help_text="How many invitations or voice calls this pack adds when purchased.",
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Inactive packs are hidden from organizers but keep existing purchase history intact.",
    )

    display_order = models.PositiveIntegerField(
        default=0,
    )

    class Meta:
        db_table = "topup_packs"
        ordering = ["display_order", "price"]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_kind_display()})"


class TopupPurchase(TimeStampedModel):
    """A single paid purchase of a TopupPack by an organizer.

    Mirrors payments.Payment's CREATED -> PAID lifecycle (its own Stripe
    Checkout Session, confirmed via the same webhook pattern), kept as a
    separate model rather than overloading Payment because Payment is
    tightly coupled to MembershipPlan (plan=ForeignKey, non-nullable) and
    to create_active_subscription() - a topup purchase activates very
    differently (adds to an existing subscription's topup counters
    rather than creating a new Subscription row).
    """

    class Status(models.TextChoices):
        CREATED = "CREATED", "Created"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"

    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="topup_purchases",
    )

    pack = models.ForeignKey(
        TopupPack,
        on_delete=models.PROTECT,
        related_name="purchases",
    )

    stripe_checkout_session_id = models.CharField(
        max_length=200,
        unique=True,
    )

    stripe_payment_intent_id = models.CharField(
        max_length=200,
        blank=True,
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CREATED,
    )

    class Meta:
        db_table = "topup_purchases"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.user.mobile_number} - {self.pack.name} ({self.status})"


class PlatformChannelPool(TimeStampedModel):
    """Phase 26: the admin's platform-wide send capacity per channel.

    Models the real-world constraint behind every automated channel: the
    admin buys bulk capacity from a provider (Twilio SMS credits, Twilio
    Voice minutes, an email-sending allotment) and tops it up here. EVERY
    send - regardless of which organizer, which plan, or whether it came
    from a topup - draws from this same shared pool for its channel. When
    a channel's pool hits zero, sends on that channel hard-block
    platform-wide until the admin tops it up again, independent of any
    individual organizer's own remaining quota.

    One row per channel (OneToOne-like via a unique `channel`), created
    on demand (get_or_create) rather than via a fixtures/migration
    seed, so a fresh deployment starts with no rows and every channel
    reads as "unlimited" (see services.check_platform_pool) until the
    admin explicitly tops one up - a pool that was never topped up should
    never accidentally block sends.
    """

    class Channel(models.TextChoices):
        WHATSAPP = "WHATSAPP", "WhatsApp"
        EMAIL = "EMAIL", "Email"
        SMS = "SMS", "SMS"
        VOICE_CALL = "VOICE_CALL", "Voice Call"

    channel = models.CharField(
        max_length=20,
        choices=Channel.choices,
        unique=True,
    )

    total_capacity = models.PositiveIntegerField(
        default=0,
        help_text="Total units ever topped up for this channel (cumulative, not a current balance).",
    )

    used = models.PositiveIntegerField(
        default=0,
        help_text="Units consumed so far against total_capacity.",
    )

    low_balance_threshold = models.PositiveIntegerField(
        default=100,
        help_text="Remaining balance at or below which the admin dashboard flags this channel as low.",
    )

    class Meta:
        db_table = "platform_channel_pools"

    def __str__(self) -> str:
        return f"{self.get_channel_display()}: {self.remaining()} remaining"

    def remaining(self) -> int:
        return max(self.total_capacity - self.used, 0)

    def is_low(self) -> bool:
        return self.remaining() <= self.low_balance_threshold

    def is_exhausted(self) -> bool:
        return self.remaining() <= 0


class PlatformPoolTopup(TimeStampedModel):
    """An audit record of one admin top-up action on a PlatformChannelPool.

    Kept separate from the pool itself (rather than just incrementing
    total_capacity with no trace) so the admin dashboard can show a
    top-up history per channel - when, how much, and by whom.
    """

    pool = models.ForeignKey(
        PlatformChannelPool,
        on_delete=models.CASCADE,
        related_name="topups",
    )

    amount = models.PositiveIntegerField(
        help_text="Units added to the pool's total_capacity by this top-up.",
    )

    note = models.CharField(
        max_length=255,
        blank=True,
        help_text='Optional admin note, e.g. "Twilio SMS credit purchase - invoice #1234".',
    )

    topped_up_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="platform_pool_topups_made",
    )

    class Meta:
        db_table = "platform_pool_topups"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"+{self.amount} to {self.pool.channel}"