from common.permissions import IsOrganizer
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import build_active_template_preview, get_active_filled_template


class ActiveFilledTemplatePreviewView(APIView):
    """The Templates page's "selected template" panel: the organizer's
    confirmed text drawn on the template, exactly as guests will receive
    it (with a sample guest name).

    Returns data: null when no template is currently selected.
    """

    permission_classes = [IsAuthenticated, IsOrganizer]

    def get(self, request):
        active = get_active_filled_template(request.user)

        if active is None:
            return Response(
                {
                    "success": True,
                    "message": "No template is currently selected.",
                    "data": None,
                },
                status=status.HTTP_200_OK,
            )

        guest_name = (request.query_params.get("guest_name") or "Guest Name").strip()[:60]

        return Response(
            {
                "success": True,
                "message": "Preview generated successfully.",
                "data": build_active_template_preview(active, guest_name),
            },
            status=status.HTTP_200_OK,
        )