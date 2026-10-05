import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createGuest,
  createGuestCategory,
  deleteGuest,
  deleteGuestCategory,
  getGuestById,
  getGuestCategories,
  getGuests,
  importGuestsCsv,
  importGuestsFromContacts,
  updateGuest,
  updateGuestCategory,
  type GuestsQueryParams,
} from "@/api/guests.api";
import type {
  ContactImportPayload,
  CreateGuestCategoryPayload,
  CreateGuestPayload,
  UpdateGuestCategoryPayload,
  UpdateGuestPayload,
} from "@/types/guest.types";

export const guestKeys = {
  lists: (eventId: number) => ["guests", eventId, "list"] as const,
  list: (eventId: number, params: GuestsQueryParams) =>
    ["guests", eventId, "list", params] as const,
  detail: (eventId: number, guestId: number) => ["guests", eventId, "detail", guestId] as const,
  categories: (eventId: number) => ["guests", eventId, "categories"] as const,
};

export function useGuests(eventId: number, params: GuestsQueryParams = {}) {
  return useQuery({
    queryKey: guestKeys.list(eventId, params),
    queryFn: () => getGuests(eventId, params),
    placeholderData: keepPreviousData,
  });
}

export function useGuest(eventId: number, guestId: number | undefined) {
  return useQuery({
    queryKey: guestKeys.detail(eventId, guestId ?? 0),
    queryFn: () => getGuestById(eventId, guestId as number),
    enabled: !!guestId,
  });
}

export function useCreateGuestMutation(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGuestPayload) => createGuest(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.lists(eventId) });
      queryClient.invalidateQueries({ queryKey: guestKeys.categories(eventId) });
    },
  });
}

export function useUpdateGuestMutation(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ guestId, payload }: { guestId: number; payload: UpdateGuestPayload }) =>
      updateGuest(eventId, guestId, payload),
    onSuccess: (guest) => {
      queryClient.invalidateQueries({ queryKey: guestKeys.lists(eventId) });
      queryClient.invalidateQueries({ queryKey: guestKeys.categories(eventId) });
      queryClient.setQueryData(guestKeys.detail(eventId, guest.id), guest);
    },
  });
}

export function useDeleteGuestMutation(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (guestId: number) => deleteGuest(eventId, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.lists(eventId) });
      queryClient.invalidateQueries({ queryKey: guestKeys.categories(eventId) });
    },
  });
}

export function useImportGuestsCsvMutation(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, categoryId }: { file: File; categoryId?: number }) =>
      importGuestsCsv(eventId, file, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.lists(eventId) });
      queryClient.invalidateQueries({ queryKey: guestKeys.categories(eventId) });
    },
  });
}

export function useImportGuestsFromContactsMutation(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContactImportPayload) => importGuestsFromContacts(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.lists(eventId) });
      queryClient.invalidateQueries({ queryKey: guestKeys.categories(eventId) });
    },
  });
}

// ---------------------------------------------------------------------------
// Guest Categories (Phase 15)
// ---------------------------------------------------------------------------

export function useGuestCategories(eventId: number) {
  return useQuery({
    queryKey: guestKeys.categories(eventId),
    queryFn: () => getGuestCategories(eventId),
  });
}

export function useCreateGuestCategoryMutation(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGuestCategoryPayload) => createGuestCategory(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.categories(eventId) });
    },
  });
}

export function useUpdateGuestCategoryMutation(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      payload,
    }: {
      categoryId: number;
      payload: UpdateGuestCategoryPayload;
    }) => updateGuestCategory(eventId, categoryId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.categories(eventId) });
    },
  });
}

export function useDeleteGuestCategoryMutation(eventId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: number) => deleteGuestCategory(eventId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.categories(eventId) });
      queryClient.invalidateQueries({ queryKey: guestKeys.lists(eventId) });
    },
  });
}