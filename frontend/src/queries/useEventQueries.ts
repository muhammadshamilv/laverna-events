import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  updateEvent,
} from "@/api/events.api";
import type { CreateEventPayload, UpdateEventPayload } from "@/types/event.types";

export const eventKeys = {
  all: ["events"] as const,
  lists: () => ["events", "list"] as const,
  list: (page: number) => ["events", "list", page] as const,
  detail: (id: number) => ["events", "detail", id] as const,
};

export function useEvents(page: number) {
  return useQuery({
    queryKey: eventKeys.list(page),
    queryFn: () => getEvents(page),
    // Keeps showing the current page's data while the next page loads,
    // instead of flashing a skeleton on every page change.
    placeholderData: keepPreviousData,
  });
}

export function useEvent(id: number | undefined) {
  return useQuery({
    queryKey: eventKeys.detail(id ?? 0),
    queryFn: () => getEventById(id as number),
    enabled: !!id,
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),
    onSuccess: () => {
      // Prefix match: invalidates every page's cached list (["events","list",1],
      // ["events","list",2], ...), not just page 1.
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateEventPayload }) =>
      updateEvent(id, payload),
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
      // setQueryData rather than invalidating the detail query too: the
      // mutation response already IS the fresh record, so writing it
      // straight into the cache shows the update immediately with no
      // extra round trip, while still being visible to any other
      // component reading useEvent(event.id).
      queryClient.setQueryData(eventKeys.detail(event.id), event);
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() });
    },
  });
}
