from common.permissions import IsOrganizer
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from events.models import Event
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    EventQRCodeSerializer,
    ScannedEventSerializer,
    SelfieMatchResultSerializer,
    SelfieUploadSerializer,
)
from .services import (
    QRCodeError,
    generate_qr_pdf_bytes,
    generate_qr_png_bytes,
    get_or_create_event_qr_code,
    match_selfie_to_gallery,
    resolve_active_qr_code,
)


class EventQRCodeView(APIView):
    """Organizer-only: view this event's QR code details (token, scan
    URL, download links). Creates the QR code record on first access -
    see get_or_create_event_qr_code's docstring for why that's lazy
    rather than automatic at event-creation time."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get(self, request, event_pk):
        event = get_object_or_404(Event, pk=event_pk, organizer=request.user)
        qr_code = get_or_create_event_qr_code(event)

        serializer = EventQRCodeSerializer(qr_code, context={"request": request})

        return Response(
            {
                "success": True,
                "message": "QR code retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class EventQRCodePNGView(APIView):
    """Organizer-only: download this event's QR code as a PNG file."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get(self, request, event_pk):
        event = get_object_or_404(Event, pk=event_pk, organizer=request.user)
        qr_code = get_or_create_event_qr_code(event)

        png_bytes = generate_qr_png_bytes(qr_code)

        response = HttpResponse(png_bytes, content_type="image/png")
        response["Content-Disposition"] = f'attachment; filename="event-{event.pk}-qr-code.png"'
        return response


class EventQRCodePDFView(APIView):
    """Organizer-only: download this event's QR code as a print-ready
    PDF (per the product requirement to print and place it at the venue)."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get(self, request, event_pk):
        event = get_object_or_404(Event, pk=event_pk, organizer=request.user)
        qr_code = get_or_create_event_qr_code(event)

        pdf_bytes = generate_qr_pdf_bytes(qr_code)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="event-{event.pk}-qr-code.pdf"'
        return response


class ScannedEventView(APIView):
    """Public, no login required: what a guest's browser loads the
    instant they scan the QR code and land on /scan/<token>. Returns just
    enough event info to render the landing page before the
    camera/selfie step - see ScannedEventSerializer's docstring for why
    this is intentionally minimal."""

    permission_classes = [AllowAny]

    def get(self, request, token):
        qr_code = resolve_active_qr_code(token)

        serializer = ScannedEventSerializer(qr_code.event, context={"request": request})

        return Response(
            {
                "success": True,
                "message": "Event retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class GuestSelfieMatchView(APIView):
    """Public, no login required: the guest uploads a selfie and gets
    back every gallery photo containing their face. This is the entire
    "AI Face Recognition -> Matching Photos" step of the product's
    documented guest workflow, in one request-response cycle (synchronous
    processing, per the project's Phase 13 architecture decision - no
    background task queue)."""

    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, token):
        qr_code = resolve_active_qr_code(token)

        serializer = SelfieUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Please upload a selfie photo.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            matched_media, session = match_selfie_to_gallery(
                event=qr_code.event,
                selfie_file=serializer.validated_data["selfie"],
            )
        except QRCodeError as error:
            return Response(
                {
                    "success": False,
                    "message": error.message,
                    "errors": {"selfie": [error.code]},
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = SelfieMatchResultSerializer(
            {"match_count": session.match_count, "matched_media": matched_media},
            context={"request": request},
        )

        return Response(
            {
                "success": True,
                "message": (
                    "We found photos of you!"
                    if matched_media
                    else "No matching photos were found yet. Check back later as more photos are uploaded."
                ),
                "data": result.data,
            },
            status=status.HTTP_200_OK,
        )
