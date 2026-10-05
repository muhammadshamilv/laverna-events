from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin configuration for viewing payment records."""

    list_display = (
        "user",
        "plan",
        "amount",
        "currency",
        "status",
        "stripe_checkout_session_id",
        "created_at",
    )

    list_filter = (
        "status",
        "plan",
    )

    search_fields = (
        "user__mobile_number",
        "user__email",
        "stripe_checkout_session_id",
        "stripe_payment_intent_id",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "stripe_checkout_session_id",
        "stripe_payment_intent_id",
        "created_at",
        "updated_at",
    )
