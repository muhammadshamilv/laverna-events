from common.permissions import IsOrganizer, IsPhotographer
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from events.models import Event

from .models import PhotographerEventAccess
from .serializers import (
    GrantPhotographerAccessSerializer,
    PhotographerAccessSerializer,
    PhotographerEventGrantSerializer,
)
from .services import get_events_for_photographer, grant_access, revoke_access

ERROR_STATUS_MAP = {
    "no_access": status.HTTP_403_FORBIDDEN,
}


class EventPhotographerAccessView(APIView):
    """Organizer-side: list everyone granted access to this event, or grant a new one.

    Scoped to organizer-owned events only - get_object_or_404 filters by
    organizer=request.user, so an organizer can never see or grant access
    on another organizer's event, and a non-existent/foreign event id
    returns a plain 404 rather than leaking whether it exists.
    """

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get_event(self, request, event_pk):
        return get_object_or_404(Event, pk=event_pk, organizer=request.user)

    def get(self, request, event_pk):
        """List every access grant (active and revoked) for this event."""

        event = self.get_event(request, event_pk)

        grants = event.photographer_access_grants.select_related(
            "photographer"
        ).order_by("-created_at")

        serializer = PhotographerAccessSerializer(grants, many=True)

        return Response(
            {
                "success": True,
                "message": "Photographer access grants retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, event_pk):
        """Grant a photographer access to this event, by mobile number."""

        event = self.get_event(request, event_pk)

        serializer = GrantPhotographerAccessSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Could not grant access.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        photographer = serializer.context["photographer"]

        grant = grant_access(
            event=event,
            photographer=photographer,
            granted_by=request.user,
            expires_at=serializer.validated_data.get("expires_at"),
        )

        return Response(
            {
                "success": True,
                "message": f"{photographer.full_name} now has access to this event's gallery.",
                "data": PhotographerAccessSerializer(grant).data,
            },
            status=status.HTTP_201_CREATED,
        )


class RevokePhotographerAccessView(APIView):
    """Organizer-side: revoke one photographer's access to one event."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    def post(self, request, event_pk, grant_pk):
        """Revoke the given access grant. Scoped to the requesting organizer's own event."""

        grant = get_object_or_404(
            PhotographerEventAccess,
            pk=grant_pk,
            event_id=event_pk,
            event__organizer=request.user,
        )

        grant = revoke_access(grant)

        return Response(
            {
                "success": True,
                "message": f"Access revoked for {grant.photographer.full_name}.",
                "data": PhotographerAccessSerializer(grant).data,
            },
            status=status.HTTP_200_OK,
        )


class MyPhotographerEventsView(APIView):
    """Photographer-side: list every event this photographer currently has valid access to."""

    permission_classes = [IsAuthenticated, IsPhotographer]

    def get(self, request):
        """Return only currently-valid (active, non-expired) grants."""

        grants = get_events_for_photographer(request.user)

        serializer = PhotographerEventGrantSerializer(
            grants, many=True, context={"request": request}
        )

        return Response(
            {
                "success": True,
                "message": "Your assigned events were retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
