import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteGalleryMedia,
  getEventGallery,
  toggleGalleryMediaFeatured,
  uploadGalleryMedia,
} from "@/api/gallery.api";

export const galleryKeys = {
  all: ["gallery"] as const,
  event: (eventId: number) => ["gallery", "event", eventId] as const,
};

export function useEventGallery(eventId: number | undefined) {
  return useQuery({
    queryKey: galleryKeys.event(eventId ?? 0),
    queryFn: () => getEventGallery(eventId as number),
    enabled: !!eventId,
  });
}

export function useUploadGalleryMediaMutation(eventId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, caption }: { file: File; caption?: string }) =>
      uploadGalleryMedia(eventId as number, file, caption),
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: galleryKeys.event(eventId) });
      }
    },
  });
}

export function useDeleteGalleryMediaMutation(eventId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: number) => deleteGalleryMedia(eventId as number, mediaId),
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: galleryKeys.event(eventId) });
      }
    },
  });
}

export function useToggleGalleryMediaFeaturedMutation(eventId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: number) => toggleGalleryMediaFeatured(eventId as number, mediaId),
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: galleryKeys.event(eventId) });
      }
    },
  });
}