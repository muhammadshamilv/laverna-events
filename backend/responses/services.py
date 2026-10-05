from django.utils import timezone
from guests.models import Guest
from invitations.models import Invitation


class ResponseError(Exception):
    """Raised when a guest response action cannot be completed."""

    def __init__(self, message: str, code: str = "response_error"):
        self.message = message
        self.code = code
        super().__init__(message)


def get_invitation_by_token(response_token: str) -> Invitation:
    """Return the invitation matching this response token.

    Raises ResponseError if no invitation matches -- this covers both a
    genuinely invalid token and someone guessing a random string, and
    intentionally gives no hint about which case it is.
    """

    invitation = Invitation.objects.select_related(
        "event", "guest"
    ).filter(response_token=response_token).first()

    if invitation is None:
        raise ResponseError(
            "This invitation link is invalid or has expired.",
            code="invalid_token",
        )

    return invitation


VALID_RESPONSES = {
    "ACCEPTED": Guest.ResponseStatus.ACCEPTED,
    "REJECTED": Guest.ResponseStatus.REJECTED,
    "MAYBE": Guest.ResponseStatus.MAYBE,
}


def submit_guest_response(response_token: str, response_value: str) -> Guest:
    """Record a guest's Accept/Reject/Maybe response using their invitation token.

    Raises ResponseError if the token is invalid, the response value is
    not one of ACCEPTED/REJECTED/MAYBE, or the guest has already
    responded (one response per guest, enforced here).
    """

    if response_value not in VALID_RESPONSES:
        raise ResponseError(
            "Response must be one of: ACCEPTED, REJECTED, MAYBE.",
            code="invalid_response_value",
        )

    invitation = get_invitation_by_token(response_token)

    guest = invitation.guest

    if guest.response_status != Guest.ResponseStatus.PENDING:
        raise ResponseError(
            "You have already responded to this invitation.",
            code="already_responded",
        )

    guest.response_status = VALID_RESPONSES[response_value]
    guest.responded_at = timezone.now()
    guest.save(update_fields=["response_status", "responded_at", "updated_at"])

    return guest
