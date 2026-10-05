import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api.types";
import type {
  GrantPhotographerAccessPayload,
  PhotographerAccessGrant,
  PhotographerEventGrant,
} from "@/types/photographer.types";

// Organizer-side: manage who has photographer access to a given event.

export async function getEventPhotographerAccess(
  eventId: number
): Promise<PhotographerAccessGrant[]> {
  const { data } = await apiClient.get<ApiResponse<PhotographerAccessGrant[]>>(
    `/events/${eventId}/photographer-access/`
  );
  return data.data;
}

export async function grantPhotographerAccess(
  eventId: number,
  payload: GrantPhotographerAccessPayload
): Promise<PhotographerAccessGrant> {
  const { data } = await apiClient.post<ApiResponse<PhotographerAccessGrant>>(
    `/events/${eventId}/photographer-access/`,
    payload
  );
  return data.data;
}

export async function revokePhotographerAccess(
  eventId: number,
  grantId: number
): Promise<PhotographerAccessGrant> {
  const { data } = await apiClient.post<ApiResponse<PhotographerAccessGrant>>(
    `/events/${eventId}/photographer-access/${grantId}/revoke/`
  );
  return data.data;
}

// Photographer-side: events this photographer currently has valid access to.

export async function getMyPhotographerEvents(): Promise<PhotographerEventGrant[]> {
  const { data } = await apiClient.get<ApiResponse<PhotographerEventGrant[]>>(
    "/photographer/my-events/"
  );
  return data.data;
}