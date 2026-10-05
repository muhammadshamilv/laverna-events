from django.urls import path

from .views import EventGalleryView, GalleryMediaDetailView


urlpatterns = [
    path(
        "events/<int:event_pk>/gallery/",
        EventGalleryView.as_view(),
        name="event-gallery",
    ),
    path(
        "events/<int:event_pk>/gallery/<int:media_pk>/",
        GalleryMediaDetailView.as_view(),
        name="gallery-media-detail",
    ),
]
