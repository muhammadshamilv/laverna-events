from common.permissions import IsOrganizer, IsOwner
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event
from .serializers import EventListSerializer, EventSerializer
from .services import EventError, create_event, delete_event, update_event


class EventListCreateView(ListAPIView):
    """List the organizer's own events, or create a new one."""

    serializer_class = EventListSerializer
    permission_classes = [IsAuthenticated, IsOrganizer]

    ERROR_STATUS_MAP = {
        "event_limit_exceeded": status.HTTP_409_CONFLICT,
        "no_active_plan": status.HTTP_402_PAYMENT_REQUIRED,
    }

    def get_queryset(self):
        """Return only events belonging to the requesting organizer."""

        return Event.objects.filter(organizer=self.request.user)

    def list(self, request, *args, **kwargs):
        """Return the organizer's events, paginated via the shared pagination class."""

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)

        return Response(
            {
                "success": True,
                "message": "Events retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, *args, **kwargs):
        """Create a new event for the requesting organizer."""

        serializer = EventSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Event creation failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            event = create_event(
                organizer=request.user,
                validated_data=serializer.validated_data,
            )

        except EventError as error:
            response_status = self.ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"event": [error.message]},
                },
                status=response_status,
            )

        response_serializer = EventSerializer(event)

        return Response(
            {
                "success": True,
                "message": "Event created successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class EventDetailView(APIView):
    """Retrieve, update, or delete a single event owned by the requesting organizer."""

    permission_classes = [IsAuthenticated, IsOrganizer, IsOwner]

    owner_field = "organizer"

    def get_object(self, pk, request):
        """Fetch the event and check object-level ownership permission."""

        event = Event.objects.filter(pk=pk).first()

        if event is None:
            return None

        self.check_object_permissions(request, event)

        return event

    def get(self, request, pk):
        """Return a single event's details."""

        event = self.get_object(pk, request)

        if event is None:
            return Response(
                {
                    "success": False,
                    "message": "Event not found.",
                    "errors": {"event": ["No event found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = EventSerializer(event)

        return Response(
            {
                "success": True,
                "message": "Event retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        """Partially update an event."""

        event = self.get_object(pk, request)

        if event is None:
            return Response(
                {
                    "success": False,
                    "message": "Event not found.",
                    "errors": {"event": ["No event found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = EventSerializer(
            event,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Event update failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_event = update_event(
            event,
            serializer.validated_data,
        )

        response_serializer = EventSerializer(updated_event)

        return Response(
            {
                "success": True,
                "message": "Event updated successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        """Delete an event."""

        event = self.get_object(pk, request)

        if event is None:
            return Response(
                {
                    "success": False,
                    "message": "Event not found.",
                    "errors": {"event": ["No event found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        delete_event(event)

        return Response(
            {
                "success": True,
                "message": "Event deleted successfully.",
                "data": {},
            },
            status=status.HTTP_200_OK,
        )
