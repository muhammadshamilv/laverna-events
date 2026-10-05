from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """JWT authentication that reads the access token from an httpOnly cookie.

    Falls back to the standard `Authorization: Bearer <token>` header so
    existing tooling (admin, API tests, Postman) keeps working unchanged.
    """

    def authenticate(self, request):
        header = self.get_header(request)

        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            raw_token = request.COOKIES.get(
                "access_token"
            )

        if raw_token is None:
            return None

        # A stale/expired/malformed access_token cookie must NOT hard-fail
        # the request - it must be treated the same as "no token at all"
        # (returning None here means "this authenticator found nothing",
        # letting DRF fall through to AnonymousUser and the view's own
        # permission_classes decide what happens next). Without this
        # try/except, get_validated_token() raises InvalidToken for any
        # expired/garbage cookie, and DRF treats an authentication
        # exception as an immediate 401 - BEFORE permission_classes is
        # ever consulted. That meant a single stale cookie left over from
        # a previous session could 401 every request site-wide, including
        # fully public, AllowAny endpoints like /auth/register/,
        # /auth/login/, and the public RSVP /respond/<token>/ page - none
        # of which should ever care whether an unrelated cookie is valid.
        #
        # The SAME problem applies to get_user() below, not just
        # get_validated_token() above: a token can be perfectly
        # well-formed and unexpired (so get_validated_token() succeeds)
        # while still pointing at a user id that no longer exists in the
        # database - e.g. the DB was reset, or a test user created via
        # Django admin was deleted/recreated with a new id, while the
        # browser still holds an old access_token cookie from a previous
        # session. In that case JWTAuthentication.get_user() raises
        # AuthenticationFailed("User not found"), which - left uncaught -
        # is exactly the same site-wide "every request 401s, including
        # AllowAny ones like /auth/register/ and /auth/login/" failure
        # mode this method was already written to prevent. It has to be
        # caught here too, for the same reason: a stale cookie's user
        # must be treated as "not authenticated", not as a fatal error.
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
        except (InvalidToken, TokenError, AuthenticationFailed):
            return None

        return user, validated_token