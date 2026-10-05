from common.permissions import IsOrganizer
from events.models import Event
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Guest, GuestCategory
from .serializers import (
    ContactImportRequestSerializer,
    ContactImportResultSerializer,
    CSVImportResultSerializer,
    GuestCategorySerializer,
    GuestSerializer,
)
from .services import (
    GuestError,
    bulk_import_guests,
    create_category,
    create_guest,
    delete_category,
    delete_guest,
    export_guests_to_csv,
    import_guests_from_csv,
    update_category,
    update_guest,
)

GUEST_ERROR_STATUS_MAP = {
    "guest_limit_exceeded": status.HTTP_409_CONFLICT,
    "no_active_plan": status.HTTP_402_PAYMENT_REQUIRED,
    "duplicate_guest": status.HTTP_409_CONFLICT,
}

CATEGORY_ERROR_STATUS_MAP = {
    "duplicate_category": status.HTTP_409_CONFLICT,
}


def get_owned_event_or_none(pk: int, user) -> Event | None:
    """Return the event only if it exists and belongs to the requesting user."""

    return Event.objects.filter(pk=pk, organizer=user).first()


class GuestListCreateView(ListAPIView):
    """List guests for an event, or add a new guest to it."""

    serializer_class = GuestSerializer
    permission_classes = [IsAuthenticated, IsOrganizer]
    filterset_fields = ["response_status", "invitation_status", "category"]
    search_fields = ["name", "mobile_number"]

    def get_queryset(self):
        """Return guests for the event, scoped to the requesting organizer."""

        return Guest.objects.filter(
            event__pk=self.kwargs["event_pk"],
            event__organizer=self.request.user,
        )

    def list(self, request, *args, **kwargs):
        """Return the event's guests, paginated, with optional search/filter."""

        event = get_owned_event_or_none(kwargs["event_pk"], request.user)

        if event is None:
            return Response(
                {
                    "success": False,
                    "message": "Event not found.",
                    "errors": {"event": ["No event found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        queryset = self.filter_queryset(self.get_queryset())

        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(name__icontains=search) | queryset.filter(
                mobile_number__icontains=search
            )

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)

        return Response(
            {
                "success": True,
                "message": "Guests retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, event_pk):
        """Add a new guest to the event."""

        event = get_owned_event_or_none(event_pk, request.user)

        if event is None:
            return Response(
                {
                    "success": False,
                    "message": "Event not found.",
                    "errors": {"event": ["No event found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = GuestSerializer(data=request.data, context={"view": self, "event": event})
        self.event = event

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Guest creation failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            guest = create_guest(
                event=event,
                organizer=request.user,
                validated_data=serializer.validated_data,
            )

        except GuestError as error:
            response_status = GUEST_ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"guest": [error.message]},
                },
                status=response_status,
            )

        response_serializer = GuestSerializer(guest)

        return Response(
            {
                "success": True,
                "message": "Guest added successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class GuestDetailView(APIView):
    """Retrieve, update, or delete a single guest belonging to the organizer's event."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get_object(self, event_pk, guest_pk, user) -> Guest | None:
        """Fetch the guest, scoped to the organizer's own event."""

        return Guest.objects.filter(
            pk=guest_pk,
            event__pk=event_pk,
            event__organizer=user,
        ).first()

    def get(self, request, event_pk, guest_pk):
        """Return a single guest's details."""

        guest = self.get_object(event_pk, guest_pk, request.user)

        if guest is None:
            return Response(
                {
                    "success": False,
                    "message": "Guest not found.",
                    "errors": {"guest": ["No guest found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = GuestSerializer(guest)

        return Response(
            {
                "success": True,
                "message": "Guest retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, event_pk, guest_pk):
        """Partially update a guest."""

        guest = self.get_object(event_pk, guest_pk, request.user)

        if guest is None:
            return Response(
                {
                    "success": False,
                    "message": "Guest not found.",
                    "errors": {"guest": ["No guest found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = GuestSerializer(
            guest,
            data=request.data,
            partial=True,
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Guest update failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            updated_guest = update_guest(
                guest,
                serializer.validated_data,
            )

        except GuestError as error:
            response_status = GUEST_ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"guest": [error.message]},
                },
                status=response_status,
            )

        response_serializer = GuestSerializer(updated_guest)

        return Response(
            {
                "success": True,
                "message": "Guest updated successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, event_pk, guest_pk):
        """Delete a guest."""

        guest = self.get_object(event_pk, guest_pk, request.user)

        if guest is None:
            return Response(
                {
                    "success": False,
                    "message": "Guest not found.",
                    "errors": {"guest": ["No guest found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        delete_guest(guest)

        return Response(
            {
                "success": True,
                "message": "Guest deleted successfully.",
                "data": {},
            },
            status=status.HTTP_200_OK,
        )


class GuestCSVImportView(APIView):
    """Import guests for an event from an uploaded CSV file."""

    permission_classes = [IsAuthenticated, IsOrganizer]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, event_pk):
        """Parse and import guests from the uploaded CSV file."""

        event = get_owned_event_or_none(event_pk, request.user)

        if event is None:
            return Response(
                {
                    "success": False,
                    "message": "Event not found.",
                    "errors": {"event": ["No event found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        csv_file = request.FILES.get("file")

        if csv_file is None:
            return Response(
                {
                    "success": False,
                    "message": "No file uploaded.",
                    "errors": {"file": ["This field is required."]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Phase 15: an optional category_id lets the organizer import a CSV
        # directly into one of this event's categories (e.g. "this CSV is
        # my Family list"). Omitted/blank keeps the prior behavior - guests
        # land uncategorized (category=None).
        category = None
        category_id = request.data.get("category_id")

        if category_id:
            category = GuestCategory.objects.filter(pk=category_id, event=event).first()

            if category is None:
                return Response(
                    {
                        "success": False,
                        "message": "Invalid category.",
                        "errors": {"category_id": ["This category does not belong to this event."]},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            result = import_guests_from_csv(
                event=event,
                organizer=request.user,
                csv_file=csv_file,
                category=category,
            )

        except GuestError as error:
            response_status = GUEST_ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"file": [error.message]},
                },
                status=response_status,
            )

        serializer = CSVImportResultSerializer(result)

        return Response(
            {
                "success": True,
                "message": (
                    f"Import complete: {result['created_count']} added, "
                    f"{result['skipped_count']} skipped."
                ),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class GuestCSVExportView(APIView):
    """Export an event's guest list as a downloadable CSV file."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get(self, request, event_pk):
        """Return a CSV file of the event's guests."""

        event = get_owned_event_or_none(event_pk, request.user)

        if event is None:
            return Response(
                {
                    "success": False,
                    "message": "Event not found.",
                    "errors": {"event": ["No event found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        csv_content = export_guests_to_csv(event)

        from django.http import HttpResponse

        response = HttpResponse(csv_content, content_type="text/csv")
        response["Content-Disposition"] = (
            f'attachment; filename="guests-event-{event_pk}.csv"'
        )

        return response


class GuestContactImportView(APIView):
    """Bulk-create guests from the frontend's Contact Picker review table.

    Phase 16. The organizer picks phone contacts via the browser's
    Contact Picker API, reviews/edits them (name, number, email, category
    per row) in an editable table, then submits the whole batch here in
    one request. Distinct from GuestCSVImportView: this takes a JSON
    array of already-structured rows (no file parsing), one category can
    be set per row rather than one category for the whole batch.
    """

    permission_classes = [IsAuthenticated, IsOrganizer]

    def post(self, request, event_pk):
        """Validate and bulk-create guests from the submitted contact rows."""

        event = get_owned_event_or_none(event_pk, request.user)

        if event is None:
            return Response(
                {
                    "success": False,
                    "message": "Event not found.",
                    "errors": {"event": ["No event found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ContactImportRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Contact import failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Guard against a category from a DIFFERENT event being slipped
        # into the payload (ContactImportRowSerializer's PrimaryKeyRelatedField
        # only confirms the category exists SOMEWHERE, not that it belongs
        # to this event - that cross-event check happens here, same
        # reasoning as GuestSerializer.validate_category).
        for row in serializer.validated_data["guests"]:
            category = row.get("category")

            if category is not None and category.event_id != event.id:
                return Response(
                    {
                        "success": False,
                        "message": "Contact import failed.",
                        "errors": {
                            "guests": [
                                f"Category '{category.name}' does not belong to this event."
                            ]
                        },
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        result = bulk_import_guests(
            event=event,
            organizer=request.user,
            rows=serializer.validated_data["guests"],
        )

        response_serializer = ContactImportResultSerializer(result)

        return Response(
            {
                "success": True,
                "message": (
                    f"Import complete: {result['created_count']} added, "
                    f"{result['skipped_count']} skipped."
                ),
                "data": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class GuestCategoryListCreateView(APIView):
    """List an event's guest categories, or create a new custom one.

    Phase 15. Every event already has its default categories
    (Family/Friends/Relatives/Special Guest/VIP) seeded automatically on
    creation (see events/services.py's create_event) - this endpoint is
    for listing them (with each category's live guest_count) and for the
    organizer adding further custom categories of their own.
    """

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get(self, request, event_pk):
        """Return every category on this event, ordered by display_order."""

        event = get_owned_event_or_none(event_pk, request.user)

        if event is None:
            return Response(
                {
                    "success": False,
                    "message": "Event not found.",
                    "errors": {"event": ["No event found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        categories = GuestCategory.objects.filter(event=event)
        serializer = GuestCategorySerializer(categories, many=True)

        return Response(
            {
                "success": True,
                "message": "Guest categories retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, event_pk):
        """Create a new custom guest category on this event."""

        event = get_owned_event_or_none(event_pk, request.user)

        if event is None:
            return Response(
                {
                    "success": False,
                    "message": "Event not found.",
                    "errors": {"event": ["No event found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = GuestCategorySerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Category creation failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            category = create_category(event, serializer.validated_data)

        except GuestError as error:
            response_status = CATEGORY_ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"name": [error.message]},
                },
                status=response_status,
            )

        response_serializer = GuestCategorySerializer(category)

        return Response(
            {
                "success": True,
                "message": "Category created successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class GuestCategoryDetailView(APIView):
    """Rename/reorder, or delete, a single guest category."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get_object(self, event_pk, category_pk, user) -> GuestCategory | None:
        """Fetch the category, scoped to the organizer's own event."""

        return GuestCategory.objects.filter(
            pk=category_pk,
            event__pk=event_pk,
            event__organizer=user,
        ).first()

    def patch(self, request, event_pk, category_pk):
        """Rename or change the display_order of a category."""

        category = self.get_object(event_pk, category_pk, request.user)

        if category is None:
            return Response(
                {
                    "success": False,
                    "message": "Category not found.",
                    "errors": {"category": ["No category found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = GuestCategorySerializer(category, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Category update failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            updated_category = update_category(category, serializer.validated_data)

        except GuestError as error:
            response_status = CATEGORY_ERROR_STATUS_MAP.get(
                error.code,
                status.HTTP_400_BAD_REQUEST,
            )

            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"name": [error.message]},
                },
                status=response_status,
            )

        response_serializer = GuestCategorySerializer(updated_category)

        return Response(
            {
                "success": True,
                "message": "Category updated successfully.",
                "data": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, event_pk, category_pk):
        """Delete a category. Guests in it become uncategorized (SET_NULL)."""

        category = self.get_object(event_pk, category_pk, request.user)

        if category is None:
            return Response(
                {
                    "success": False,
                    "message": "Category not found.",
                    "errors": {"category": ["No category found with this ID."]},
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        delete_category(category)

        return Response(
            {
                "success": True,
                "message": "Category deleted successfully. Guests in it are now uncategorized.",
                "data": {},
            },
            status=status.HTTP_200_OK,
        )