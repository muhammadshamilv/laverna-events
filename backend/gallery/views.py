from common.permissions import IsOrganizer
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from events.models import Event

from .models import GalleryMedia
from .serializers import GalleryMediaSerializer, GalleryMediaUploadSerializer
from .services import can_view_gallery, delete_media, toggle_featured, upload_media


class EventGalleryView(APIView):
    """List an event's gallery, or upload a new photo/video to it.

    Reachable by the organizer who owns the event, or by any photographer
    with a currently-valid access grant for it - checked via
    can_view_gallery() rather than a permission_classes restriction, since
    the allowed-roles set differs per event (which photographer(s), if
    any, currently have access) rather than being a fixed role check.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_event_or_403(self, request, event_pk):
        event = get_object_or_404(Event, pk=event_pk)

        if not can_view_gallery(request.user, event):
            return event, False

        return event, True

    def get(self, request, event_pk):
        """List every media item in this event's gallery."""

        event, allowed = self.get_event_or_403(request, event_pk)

        if not allowed:
            return Response(
                {
                    "success": False,
                    "message": "You do not have access to this event's gallery.",
                    "errors": {"event": ["no_access"]},
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        media = event.gallery_media.select_related("uploaded_by").all()

        serializer = GalleryMediaSerializer(media, many=True, context={"request": request})

        return Response(
            {
                "success": True,
                "message": "Gallery retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, event_pk):
        """Upload a single photo or video to this event's gallery."""

        event, allowed = self.get_event_or_403(request, event_pk)

        if not allowed:
            return Response(
                {
                    "success": False,
                    "message": "You do not have access to this event's gallery.",
                    "errors": {"event": ["no_access"]},
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GalleryMediaUploadSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "message": "Upload failed.",
                    "errors": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        media = upload_media(
            event=event,
            uploaded_by=request.user,
            media_type=serializer.context["media_type"],
            file=serializer.validated_data["file"],
            thumbnail=serializer.validated_data.get("thumbnail"),
            caption=serializer.validated_data.get("caption", ""),
        )

        return Response(
            {
                "success": True,
                "message": "Uploaded successfully.",
                "data": GalleryMediaSerializer(media, context={"request": request}).data,
            },
            status=status.HTTP_201_CREATED,
        )


class GalleryMediaDetailView(APIView):
    """Organizer-only: delete a gallery item, or toggle its featured flag."""

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get_media(self, request, event_pk, media_pk):
        return get_object_or_404(
            GalleryMedia,
            pk=media_pk,
            event_id=event_pk,
            event__organizer=request.user,
        )

    def delete(self, request, event_pk, media_pk):
        """Permanently delete a gallery media item."""

        media = self.get_media(request, event_pk, media_pk)
        delete_media(media)

        return Response(
            {
                "success": True,
                "message": "Media deleted successfully.",
                "data": {},
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, event_pk, media_pk):
        """Toggle a media item's featured flag."""

        media = self.get_media(request, event_pk, media_pk)
        media = toggle_featured(media)

        return Response(
            {
                "success": True,
                "message": "Media updated successfully.",
                "data": GalleryMediaSerializer(media, context={"request": request}).data,
            },
            status=status.HTTP_200_OK,
        )
