import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEventPhotographerAccess,
  getMyPhotographerEvents,
  grantPhotographerAccess,
  revokePhotographerAccess,
} from "@/api/photographers.api";
import type { GrantPhotographerAccessPayload } from "@/types/photographer.types";

export const photographerKeys = {
  all: ["photographer-access"] as const,
  event: (eventId: number) => ["photographer-access", "event", eventId] as const,
  myEvents: () => ["photographer-access", "my-events"] as const,
};

export function useEventPhotographerAccess(eventId: number | undefined) {
  return useQuery({
    queryKey: photographerKeys.event(eventId ?? 0),
    queryFn: () => getEventPhotographerAccess(eventId as number),
    enabled: !!eventId,
  });
}

export function useGrantPhotographerAccessMutation(eventId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GrantPhotographerAccessPayload) =>
      grantPhotographerAccess(eventId as number, payload),
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: photographerKeys.event(eventId) });
      }
    },
  });
}

export function useRevokePhotographerAccessMutation(eventId: number | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (grantId: number) => revokePhotographerAccess(eventId as number, grantId),
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: photographerKeys.event(eventId) });
      }
    },
  });
}

export function useMyPhotographerEvents() {
  return useQuery({
    queryKey: photographerKeys.myEvents(),
    queryFn: getMyPhotographerEvents,
  });
}