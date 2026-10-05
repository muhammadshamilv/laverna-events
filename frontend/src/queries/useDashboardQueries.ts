import { useQuery } from "@tanstack/react-query";
import {
  getEventDashboardStats,
  getOrganizerInvitationOverview,
  getOrganizerOverview,
} from "@/api/dashboard.api";

export const dashboardKeys = {
  overview: ["dashboard", "overview"] as const,
  event: (eventId: number) => ["dashboard", "event", eventId] as const,
  invitationOverview: ["dashboard", "invitation-overview"] as const,
};

export function useOrganizerOverview() {
  return useQuery({
    queryKey: dashboardKeys.overview,
    queryFn: getOrganizerOverview,
    staleTime: 60 * 1000,
  });
}

export function useEventDashboardStats(eventId: number | undefined) {
  return useQuery({
    queryKey: dashboardKeys.event(eventId ?? 0),
    queryFn: () => getEventDashboardStats(eventId as number),
    enabled: !!eventId,
    staleTime: 30 * 1000,
  });
}

// Phase 25
export function useOrganizerInvitationOverview() {
  return useQuery({
    queryKey: dashboardKeys.invitationOverview,
    queryFn: getOrganizerInvitationOverview,
    staleTime: 60 * 1000,
  });
}