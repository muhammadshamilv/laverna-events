import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api.types";
import type {
  InvitationPublicDetails,
  SubmitResponsePayload,
  SubmitResponseResult,
} from "@/types/response.types";

// Both calls hit the same public, unauthenticated endpoint
// (GET/POST /api/respond/<response_token>/) - no auth header, no
// withCredentials-dependent session needed, since access is controlled
// entirely by possession of the token itself (see backend
// responses/views.py). apiClient still works fine here since
// withCredentials on a request with no session cookie is a no-op.
//
// Phase 23: the invitation details payload now also carries
// calendar_url (GET /api/respond/<response_token>/calendar/), a direct
// .ics download link - it's just rendered as a plain <a href>
// (RespondToInvitation.tsx), so no dedicated fetch function is needed
// for it here.

export async function getInvitationByToken(
  responseToken: string
): Promise<InvitationPublicDetails> {
  const response = await apiClient.get<ApiResponse<InvitationPublicDetails>>(
    `/respond/${responseToken}/`
  );
  return response.data.data;
}

export async function submitGuestResponse(
  responseToken: string,
  payload: SubmitResponsePayload
): Promise<SubmitResponseResult> {
  const response = await apiClient.post<ApiResponse<SubmitResponseResult>>(
    `/respond/${responseToken}/`,
    payload
  );
  return response.data.data;
}