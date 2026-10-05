from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model providing created_at/updated_at fields.

    Inherit from this in new models instead of redefining these two
    fields by hand. Existing models (User, MembershipPlan, Subscription)
    already define their own created_at/updated_at and are NOT changed
    retroactively, to avoid touching already-migrated tables.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        abstract = True
