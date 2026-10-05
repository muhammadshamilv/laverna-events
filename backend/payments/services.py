import stripe
from decouple import config
from django.db import transaction
from memberships.models import MembershipPlan
from memberships.services import create_active_subscription
from memberships.topup_models import TopupPack, TopupPurchase

from .models import Payment


class PaymentError(Exception):
    """Raised when a payment action cannot be completed."""

    def __init__(self, message: str, code: str = "payment_error"):
        self.message = message
        self.code = code
        super().__init__(message)


def _configure_stripe() -> None:
    """Set the Stripe API key from environment configuration."""

    stripe.api_key = config("STRIPE_SECRET_KEY")


def create_checkout_session(user, plan_slug: str, success_url: str, cancel_url: str) -> Payment:
    """Create a Stripe Checkout Session for purchasing a membership plan.

    Raises PaymentError if the plan does not exist or is inactive.
    """

    plan = MembershipPlan.objects.filter(
        slug=plan_slug,
        is_active=True,
    ).first()

    if plan is None:
        raise PaymentError(
            "No active membership plan found with this slug.",
            code="plan_not_found",
        )

    _configure_stripe()

    amount_in_smallest_unit = int(plan.price * 100)

    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "inr",
                    "product_data": {"name": f"LavernaEvents - {plan.name} Plan"},
                    "unit_amount": amount_in_smallest_unit,
                },
                "quantity": 1,
            }
        ],
        success_url=success_url,
        cancel_url=cancel_url,
        client_reference_id=str(user.pk),
        metadata={"user_id": user.pk, "plan_slug": plan.slug},
    )

    payment = Payment.objects.create(
        user=user,
        plan=plan,
        stripe_checkout_session_id=session.id,
        amount=plan.price,
        currency="INR",
        status=Payment.Status.CREATED,
    )

    return payment, session.url


def handle_checkout_completed(session_data) -> Payment:
    """Process a Stripe checkout.session.completed webhook event for a
    PLAN purchase.

    Raises PaymentError if the payment record is not found or has
    already been processed. Called from the webhook view, never
    directly from the frontend, since this is the trusted server-to-
    server confirmation that payment actually succeeded.

    `session_data` arrives as a stripe.checkout.Session object (not a
    plain dict) on current stripe-python versions - calling .get() on it
    directly raises AttributeError ("'get' is a dict method, but a
    Session is not a dict"), which is exactly what was making this
    endpoint 500 despite receiving a validly-signed event. Converting
    once with .to_dict() (as stripe-python's own error message
    recommends) makes the rest of this function work the same way
    whether the SDK hands back a dict or a typed object.
    """

    session_dict = (
        session_data.to_dict() if hasattr(session_data, "to_dict") else session_data
    )

    checkout_session_id = session_dict.get("id")

    payment = Payment.objects.filter(
        stripe_checkout_session_id=checkout_session_id
    ).first()

    if payment is None:
        raise PaymentError(
            "Payment record not found for this checkout session.",
            code="payment_not_found",
        )

    if payment.status == Payment.Status.PAID:
        return payment

    with transaction.atomic():
        payment.status = Payment.Status.PAID
        payment.stripe_payment_intent_id = session_dict.get("payment_intent", "") or ""
        payment.save(
            update_fields=[
                "status",
                "stripe_payment_intent_id",
                "updated_at",
            ]
        )

        create_active_subscription(payment.user, payment.plan)

    return payment


def get_payment_status(checkout_session_id: str, user) -> Payment:
    """Return the payment record for a checkout session, scoped to the requesting user.

    Used by the frontend to poll/confirm payment status after redirect
    back from Stripe Checkout, since the actual activation happens via
    webhook, not the redirect itself.
    """

    payment = Payment.objects.filter(
        stripe_checkout_session_id=checkout_session_id,
        user=user,
    ).first()

    if payment is None:
        raise PaymentError(
            "Payment record not found.",
            code="payment_not_found",
        )

    return payment


# ---------------------------------------------------------------------
# Phase 26: organizer topup pack purchases
# ---------------------------------------------------------------------

def create_topup_checkout_session(user, pack_id: int, success_url: str, cancel_url: str):
    """Create a Stripe Checkout Session for purchasing a TopupPack.

    Mirrors create_checkout_session above, but for TopupPack/TopupPurchase
    instead of MembershipPlan/Payment. Raises PaymentError if the pack
    does not exist or is inactive.
    """

    pack = TopupPack.objects.filter(pk=pack_id, is_active=True).first()

    if pack is None:
        raise PaymentError(
            "No active topup pack found with this ID.",
            code="pack_not_found",
        )

    _configure_stripe()

    amount_in_smallest_unit = int(pack.price * 100)

    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "inr",
                    "product_data": {"name": f"LavernaEvents Topup - {pack.name}"},
                    "unit_amount": amount_in_smallest_unit,
                },
                "quantity": 1,
            }
        ],
        success_url=success_url,
        cancel_url=cancel_url,
        client_reference_id=str(user.pk),
        metadata={"user_id": user.pk, "topup_pack_id": pack.pk},
    )

    purchase = TopupPurchase.objects.create(
        user=user,
        pack=pack,
        stripe_checkout_session_id=session.id,
        amount=pack.price,
        status=TopupPurchase.Status.CREATED,
    )

    return purchase, session.url


def handle_topup_checkout_completed(session_data) -> TopupPurchase:
    """Process a Stripe checkout.session.completed webhook event for a
    TOPUP PACK purchase.

    Mirrors handle_checkout_completed above. Raises PaymentError if the
    purchase record is not found. On success, adds the pack's quantity
    to the organizer's ACTIVE subscription's invitations_topup or
    voice_calls_topup counter (see memberships.models.Subscription) - if
    the organizer has no active subscription at purchase-confirmation
    time (e.g. it expired between clicking buy and Stripe confirming),
    the topup is still marked PAID but has nothing to add to; this is a
    rare edge case flagged in the return value's purchase record for
    manual review rather than silently failing the whole webhook.
    """

    from memberships.services import get_active_subscription
    from memberships.models import Subscription
    from django.db import models as dj_models
    from django.utils import timezone

    session_dict = (
        session_data.to_dict() if hasattr(session_data, "to_dict") else session_data
    )

    checkout_session_id = session_dict.get("id")

    purchase = TopupPurchase.objects.filter(
        stripe_checkout_session_id=checkout_session_id
    ).first()

    if purchase is None:
        raise PaymentError(
            "Topup purchase record not found for this checkout session.",
            code="topup_purchase_not_found",
        )

    if purchase.status == TopupPurchase.Status.PAID:
        return purchase

    with transaction.atomic():
        purchase.status = TopupPurchase.Status.PAID
        purchase.stripe_payment_intent_id = session_dict.get("payment_intent", "") or ""
        purchase.save(
            update_fields=[
                "status",
                "stripe_payment_intent_id",
                "updated_at",
            ]
        )

        subscription = get_active_subscription(purchase.user)

        if subscription is not None:
            pack = purchase.pack

            if pack.kind == TopupPack.Kind.INVITATIONS:
                Subscription.objects.filter(pk=subscription.pk).update(
                    invitations_topup=dj_models.F("invitations_topup") + pack.quantity,
                    updated_at=timezone.now(),
                )
            elif pack.kind == TopupPack.Kind.VOICE_CALLS:
                Subscription.objects.filter(pk=subscription.pk).update(
                    voice_calls_topup=dj_models.F("voice_calls_topup") + pack.quantity,
                    updated_at=timezone.now(),
                )

    return purchase


def get_topup_purchase_status(checkout_session_id: str, user) -> TopupPurchase:
    """Return the topup purchase record for a checkout session, scoped to
    the requesting user. Mirrors get_payment_status above."""

    purchase = TopupPurchase.objects.filter(
        stripe_checkout_session_id=checkout_session_id,
        user=user,
    ).first()

    if purchase is None:
        raise PaymentError(
            "Topup purchase record not found.",
            code="topup_purchase_not_found",
        )

    return purchase