from rest_framework.views import exception_handler as drf_exception_handler


def custom_exception_handler(exc, context):
    """Wrap all DRF-raised errors in the project's consistent response format.

    This only reshapes errors that DRF's default handler already catches
    (permission denied, not found, throttled, malformed input, etc). It does
    NOT catch unhandled Python exceptions — those still surface as Django's
    500 error page in development, which is expected during development.
    """

    response = drf_exception_handler(exc, context)

    if response is None:
        return None

    message = "Request failed."

    if isinstance(response.data, dict) and "detail" in response.data:
        message = str(response.data["detail"])
        errors = {"detail": [message]}

    else:
        errors = response.data

    response.data = {
        "success": False,
        "message": message,
        "errors": errors,
    }

    return response
