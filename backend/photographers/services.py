from events.models import Event

from .models import PhotographerEventAccess


class PhotographerAccessError(Exception):
    """Raised when a photographer-access action cannot be completed."""

    def __init__(self, message: str, code: str = "access_error"):
        self.message = message
        self.code = code
        super().__init__(message)


def grant_access(event: Event, photographer, granted_by, expires_at=None) -> PhotographerEventAccess:
    """Grant (or re-activate) a photographer's access to an event.

    If a grant already exists for this (event, photographer) pair - even a
    previously revoked one - it's reused and reactivated rather than
    creating a second row, since the model enforces one grant per pair via
    a unique constraint. This also means re-granting after a revoke
    naturally "just works" without the organizer hitting a duplicate error.
    """

    grant, _created = PhotographerEventAccess.objects.update_or_create(
        event=event,
        photographer=photographer,
        defaults={
            "granted_by": granted_by,
            "is_active": True,
            "expires_at": expires_at,
        },
    )

    return grant


def revoke_access(grant: PhotographerEventAccess) -> PhotographerEventAccess:
    """Revoke a photographer's access to an event. Does not delete the record,
    so the organizer retains a history of who had access and can re-grant
    later without losing the original grant date."""

    grant.is_active = False
    grant.save(update_fields=["is_active", "updated_at"])

    return grant


def get_events_for_photographer(photographer):
    """Return the events this photographer currently has valid access to.

    Filters at the database level for is_active=True (cheap), then filters
    again in Python for the expiry check via is_currently_valid() (there's
    no clean single-query way to express "expires_at is null OR expires_at
    > now" alongside the is_active check without a slightly awkward Q
    object, and the grant list per photographer is small, so the simpler
    two-step filter is preferred here over query cleverness).
    """

    grants = PhotographerEventAccess.objects.filter(
        photographer=photographer,
        is_active=True,
    ).select_related("event")

    return [grant for grant in grants if grant.is_currently_valid()]


def check_photographer_event_access(photographer, event: Event) -> PhotographerEventAccess:
    """Raise PhotographerAccessError unless this photographer currently has
    valid access to this event. Returns the grant on success, for callers
    that need it (e.g. to know who granted it)."""

    grant = PhotographerEventAccess.objects.filter(
        photographer=photographer,
        event=event,
    ).first()

    if grant is None or not grant.is_currently_valid():
        raise PhotographerAccessError(
            "You do not have access to this event's gallery.",
            code="no_access",
        )

    return grant
