import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api.types";
import type { EventQRCode, ScannedEvent, SelfieMatchResult } from "@/types/qrcode.types";

// Same pattern gallery.api.ts uses for FormData uploads through
// apiClient, which otherwise defaults Content-Type to application/json
// globally - setting it to undefined lets axios/the browser set the
// correct multipart boundary itself.
const MULTIPART_CONFIG = { headers: { "Content-Type": undefined } };

// --- Organizer-facing (authenticated) ---------------------------------

export async function getEventQRCode(eventId: number): Promise<EventQRCode> {
  const response = await apiClient.get<ApiResponse<EventQRCode>>(
    `/events/${eventId}/qr-code/`
  );
  return response.data.data;
}

/** PNG/PDF downloads are plain authenticated GETs that return the file
 * bytes directly - not JSON - so they're fetched as a blob and handed to
 * the browser as a download, rather than exposed as a clickable <a href>
 * pointing straight at the backend (an <a> would not carry the
 * cookie-based auth the same way a same-origin fetch through apiClient
 * does, and would also bypass the axios refresh-token interceptor if the
 * access token had just expired). */
export async function downloadEventQRCodeFile(
  eventId: number,
  format: "png" | "pdf"
): Promise<Blob> {
  const response = await apiClient.get(`/events/${eventId}/qr-code/${format}/`, {
    responseType: "blob",
  });
  return response.data;
}

// --- Guest-facing (public, no auth) ------------------------------------

export async function getScannedEvent(token: string): Promise<ScannedEvent> {
  const response = await apiClient.get<ApiResponse<ScannedEvent>>(`/qr/${token}/`);
  return response.data.data;
}

export async function matchSelfie(token: string, selfie: File): Promise<SelfieMatchResult> {
  const formData = new FormData();
  formData.append("selfie", selfie);

  const response = await apiClient.post<ApiResponse<SelfieMatchResult>>(
    `/qr/${token}/selfie/`,
    formData,
    MULTIPART_CONFIG
  );
  return response.data.data;
}