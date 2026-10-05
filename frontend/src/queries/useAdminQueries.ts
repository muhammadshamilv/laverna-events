import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminInvitationTemplate,
  createAdminMembershipPlan,
  createAdminTopupPack,
  deactivateAdminTopupPack,
  deleteAdminInvitationTemplate,
  deleteAdminMedia,
  deleteAdminMembershipPlan,
  deleteAdminUser,
  getAdminChannelPools,
  getAdminChannelPoolTopupHistory,
  getAdminDashboardStats,
  getAdminInvitationTemplates,
  getAdminMedia,
  getAdminMembershipPlans,
  getAdminReports,
  getAdminTopupPacks,
  getAdminUserById,
  getAdminUsers,
  suspendAdminUser,
  topupAdminChannelPool,
  unsuspendAdminUser,
  updateAdminInvitationTemplate,
  updateAdminMembershipPlan,
  updateAdminTopupPack,
  updateAdminUser,
  type AdminMediaQueryParams,
  type AdminUsersQueryParams,
} from "@/api/admin.api";
import type {
  AdminInvitationTemplatePayload,
  AdminInvitationTemplateUpdatePayload,
  AdminMembershipPlanPayload,
  AdminMembershipPlanUpdatePayload,
  AdminTopupPackPayload,
  AdminTopupPackUpdatePayload,
  AdminUserUpdatePayload,
  InvitationChannelKey,
  PlatformPoolTopupPayload,
} from "@/types/admin.types";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const adminKeys = {
  dashboard: ["admin", "dashboard"] as const,
  userLists: ["admin", "users", "list"] as const,
  userList: (params: AdminUsersQueryParams) => ["admin", "users", "list", params] as const,
  userDetail: (userId: number) => ["admin", "users", "detail", userId] as const,
  plans: ["admin", "plans"] as const,
  templates: ["admin", "templates"] as const,
  mediaLists: ["admin", "media", "list"] as const,
  mediaList: (params: AdminMediaQueryParams) => ["admin", "media", "list", params] as const,
  reports: ["admin", "reports"] as const,
  // Phase 26
  channelPools: ["admin", "channel-pools"] as const,
  channelPoolTopupHistory: (channel?: InvitationChannelKey) =>
    ["admin", "channel-pools", "topup-history", channel ?? "all"] as const,
  topupPacks: ["admin", "topup-packs"] as const,
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: getAdminDashboardStats,
  });
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function useAdminUsers(params: AdminUsersQueryParams = {}) {
  return useQuery({
    queryKey: adminKeys.userList(params),
    queryFn: () => getAdminUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUser(userId: number | undefined) {
  return useQuery({
    queryKey: adminKeys.userDetail(userId ?? 0),
    queryFn: () => getAdminUserById(userId as number),
    enabled: !!userId,
  });
}

export function useUpdateAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: AdminUserUpdatePayload }) =>
      updateAdminUser(userId, payload),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userLists });
      queryClient.setQueryData(adminKeys.userDetail(user.id), user);
    },
  });
}

export function useDeleteAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => deleteAdminUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userLists });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useSuspendAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => suspendAdminUser(userId),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userLists });
      queryClient.setQueryData(adminKeys.userDetail(user.id), user);
    },
  });
}

export function useUnsuspendAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => unsuspendAdminUser(userId),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userLists });
      queryClient.setQueryData(adminKeys.userDetail(user.id), user);
    },
  });
}

// ---------------------------------------------------------------------------
// Membership Plans
// ---------------------------------------------------------------------------

export function useAdminMembershipPlans() {
  return useQuery({
    queryKey: adminKeys.plans,
    queryFn: getAdminMembershipPlans,
  });
}

export function useCreateAdminMembershipPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminMembershipPlanPayload) => createAdminMembershipPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans });
    },
  });
}

export function useUpdateAdminMembershipPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      payload,
    }: {
      planId: number;
      payload: AdminMembershipPlanUpdatePayload;
    }) => updateAdminMembershipPlan(planId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans });
    },
  });
}

export function useDeleteAdminMembershipPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: number) => deleteAdminMembershipPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.plans });
    },
  });
}

// ---------------------------------------------------------------------------
// Invitation Templates
// ---------------------------------------------------------------------------

export function useAdminInvitationTemplates() {
  return useQuery({
    queryKey: adminKeys.templates,
    queryFn: getAdminInvitationTemplates,
  });
}

export function useCreateAdminInvitationTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminInvitationTemplatePayload) =>
      createAdminInvitationTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.templates });
    },
  });
}

export function useUpdateAdminInvitationTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      payload,
    }: {
      templateId: number;
      payload: AdminInvitationTemplateUpdatePayload;
    }) => updateAdminInvitationTemplate(templateId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.templates });
    },
  });
}

export function useDeleteAdminInvitationTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: number) => deleteAdminInvitationTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.templates });
    },
  });
}

// ---------------------------------------------------------------------------
// Gallery Media
// ---------------------------------------------------------------------------

export function useAdminMedia(params: AdminMediaQueryParams = {}) {
  return useQuery({
    queryKey: adminKeys.mediaList(params),
    queryFn: () => getAdminMedia(params),
    placeholderData: keepPreviousData,
  });
}

export function useDeleteAdminMediaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (mediaId: number) => deleteAdminMedia(mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.mediaLists });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function useAdminReports() {
  return useQuery({
    queryKey: adminKeys.reports,
    queryFn: getAdminReports,
  });
}

// ---------------------------------------------------------------------------
// Phase 26: platform channel pools
// ---------------------------------------------------------------------------

export function useAdminChannelPools() {
  return useQuery({
    queryKey: adminKeys.channelPools,
    queryFn: getAdminChannelPools,
    // Pool levels matter for "is a channel about to run out" visibility -
    // refetch somewhat eagerly whenever the admin is looking at this page.
    refetchInterval: 60 * 1000,
  });
}

export function useTopupAdminChannelPoolMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlatformPoolTopupPayload) => topupAdminChannelPool(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.channelPools });
      queryClient.invalidateQueries({ queryKey: ["admin", "channel-pools", "topup-history"] });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}

export function useAdminChannelPoolTopupHistory(channel?: InvitationChannelKey) {
  return useQuery({
    queryKey: adminKeys.channelPoolTopupHistory(channel),
    queryFn: () => getAdminChannelPoolTopupHistory(channel),
  });
}

// ---------------------------------------------------------------------------
// Phase 26: topup pack administration
// ---------------------------------------------------------------------------

export function useAdminTopupPacks() {
  return useQuery({
    queryKey: adminKeys.topupPacks,
    queryFn: getAdminTopupPacks,
  });
}

export function useCreateAdminTopupPackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminTopupPackPayload) => createAdminTopupPack(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.topupPacks });
    },
  });
}

export function useUpdateAdminTopupPackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      packId,
      payload,
    }: {
      packId: number;
      payload: AdminTopupPackUpdatePayload;
    }) => updateAdminTopupPack(packId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.topupPacks });
    },
  });
}

export function useDeactivateAdminTopupPackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (packId: number) => deactivateAdminTopupPack(packId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.topupPacks });
    },
  });
}