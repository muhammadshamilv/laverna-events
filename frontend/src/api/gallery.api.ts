import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api.types";
import type { GalleryMedia } from "@/types/gallery.types";

// See events.api.ts's MULTIPART_CONFIG comment: apiClient defaults to a
// JSON Content-Type, which must be explicitly cleared per-request for
// axios to send an actual multipart body instead of silently
// JSON.stringify()-ing the FormData (losing the file).
const MULTIPART_CONFIG = { headers: { "Content-Type": undefined } };

export async function getEventGallery(eventId: number): Promise<GalleryMedia[]> {
  const { data } = await apiClient.get<ApiResponse<GalleryMedia[]>>(
    `/events/${eventId}/gallery/`
  );
  return data.data;
}

export async function uploadGalleryMedia(
  eventId: number,
  file: File,
  caption = ""
): Promise<GalleryMedia> {
  const formData = new FormData();
  formData.append("file", file);
  if (caption) formData.append("caption", caption);

  const { data } = await apiClient.post<ApiResponse<GalleryMedia>>(
    `/events/${eventId}/gallery/`,
    formData,
    MULTIPART_CONFIG
  );
  return data.data;
}

export async function deleteGalleryMedia(eventId: number, mediaId: number): Promise<void> {
  await apiClient.delete<ApiResponse<Record<string, never>>>(
    `/events/${eventId}/gallery/${mediaId}/`
  );
}

export async function toggleGalleryMediaFeatured(
  eventId: number,
  mediaId: number
): Promise<GalleryMedia> {
  const { data } = await apiClient.patch<ApiResponse<GalleryMedia>>(
    `/events/${eventId}/gallery/${mediaId}/`
  );
  return data.data;
}