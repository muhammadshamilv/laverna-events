import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api.types";
import type {
  EventDashboardStats,
  OrganizerInvitationOverview,
  OrganizerOverview,
} from "@/types/dashboard.types";

export async function getOrganizerOverview(): Promise<OrganizerOverview> {
  const response = await apiClient.get<ApiResponse<OrganizerOverview>>(
    "/dashboard/overview/"
  );
  return response.data.data;
}

export async function getEventDashboardStats(eventId: number): Promise<EventDashboardStats> {
  const response = await apiClient.get<ApiResponse<EventDashboardStats>>(
    `/dashboard/events/${eventId}/dashboard/`
  );
  return response.data.data;
}

// Phase 25: the invitation-focused dashboard overhaul's single combined
// payload (overview + channel performance + events needing attention +
// quota usage) - one call instead of the page making four.
export async function getOrganizerInvitationOverview(): Promise<OrganizerInvitationOverview> {
  const response = await apiClient.get<ApiResponse<OrganizerInvitationOverview>>(
    "/dashboard/invitation-overview/"
  );
  return response.data.data;
}