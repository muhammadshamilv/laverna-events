from django.http import HttpResponse
from guests.models import Guest
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .calendar import build_event_ics
from .serializers import InvitationPublicSerializer, SubmitResponseSerializer
from .services import ResponseError, get_invitation_by_token, submit_guest_response

RESPONSE_ERROR_STATUS_MAP = {
    "invalid_token": status.HTTP_404_NOT_FOUND,
    "invalid_response_value": status.HTTP_400_BAD_REQUEST,
    "already_responded": status.HTTP_409_CONFLICT,
}


class InvitationResponsePageView(APIView):
    """Public endpoint: return invitation details for the guest response page.

    No authentication required -- this is the page a guest lands on
    after tapping their secure link. Access is controlled entirely by
    possession of the unguessable response_token, not a login.
    """

    permission_classes = [AllowAny]

    def get(self, request, response_token):
        """Return event and guest details needed to render the response page."""

        try:
            invitation = get_invitation_by_token(response_token)

        except ResponseError as error:
            response_status = RESPONSE_ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"token": [error.message]},
                },
                status=response_status,
            )

        event = invitation.event
        guest = invitation.guest

        data = {
            "guest_name": guest.name,
            "event_name": event.name,
            "event_type": event.event_type,
            "event_date": event.event_date,
            "event_time": event.event_time,
            "venue_name": event.venue_name,
            "address": event.address,
            "google_maps_link": event.google_maps_link,
            "invitation_image": (
                request.build_absolute_uri(invitation.image_file.url)
                if invitation.image_file
                else None
            ),
            "response_status": guest.response_status,
            "already_responded": guest.response_status != Guest.ResponseStatus.PENDING,
            # Phase 23: a ready-made link to the .ics download below, so
            # the frontend just renders an <a href> rather than
            # reconstructing this URL itself.
            "calendar_url": request.build_absolute_uri(
                f"/api/respond/{response_token}/calendar/"
            ),
        }

        serializer = InvitationPublicSerializer(data)

        return Response(
            {
                "success": True,
                "message": "Invitation details retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, response_token):
        """Submit the guest's Accept/Reject/Maybe response."""

        serializer = SubmitResponseSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Invalid response.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            guest = submit_guest_response(
                response_token=response_token,
                response_value=serializer.validated_data["response"],
            )

        except ResponseError as error:
            response_status = RESPONSE_ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"response": [error.message]},
                },
                status=response_status,
            )

        return Response(
            {
                "success": True,
                "message": "Thank you! Your response has been recorded.",
                "data": {
                    "response_status": guest.response_status,
                },
            },
            status=status.HTTP_200_OK,
        )


class InvitationCalendarView(APIView):
    """Public endpoint: download a .ics file for this guest's invited event.

    Phase 23. Same access model as InvitationResponsePageView - no
    authentication, access controlled by possession of the unguessable
    response_token. Deliberately GET-only and side-effect-free (does not
    touch response_status or any other guest/invitation state).
    """

    permission_classes = [AllowAny]

    def get(self, request, response_token):
        try:
            invitation = get_invitation_by_token(response_token)

        except ResponseError as error:
            response_status = RESPONSE_ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"token": [error.message]},
                },
                status=response_status,
            )

        ics_bytes = build_event_ics(invitation.event, invitation.guest)

        response = HttpResponse(ics_bytes, content_type="text/calendar; charset=utf-8")
        safe_name = "".join(
            ch for ch in invitation.event.name if ch.isalnum() or ch in (" ", "-", "_")
        ).strip() or "event"
        response["Content-Disposition"] = f'attachment; filename="{safe_name}.ics"'

        return response