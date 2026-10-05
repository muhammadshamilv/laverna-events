import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse, PaginationMeta } from "@/types/api.types";
import type {
  AdminDashboardStats,
  AdminGalleryMedia,
  AdminInvitationTemplate,
  AdminInvitationTemplatePayload,
  AdminInvitationTemplateUpdatePayload,
  AdminMediaQueryParams,
  AdminMembershipPlan,
  AdminMembershipPlanPayload,
  AdminMembershipPlanUpdatePayload,
  AdminReports,
  AdminTopupPack,
  AdminTopupPackPayload,
  AdminTopupPackUpdatePayload,
  AdminUser,
  AdminUserUpdatePayload,
  AdminUsersQueryParams,
  InvitationChannelKey,
  PlatformChannelPool,
  PlatformPoolTopup,
  PlatformPoolTopupPayload,
} from "@/types/admin.types";

// All endpoints are mounted at /api/admin-panel/... (admin_panel app), kept
// deliberately separate from Django's own /admin/ site - see backend notes.
// Every call here is gated server-side by [IsAuthenticated, IsAdminRole], so
// these only ever succeed for a logged-in ADMIN - the frontend route guard
// (AdminLayout) is a UX convenience on top of that, not the real boundary.

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const { data } = await apiClient.get<ApiResponse<AdminDashboardStats>>(
    "/admin-panel/dashboard/"
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface AdminUsersPage {
  users: AdminUser[];
  pagination: PaginationMeta;
}

export async function getAdminUsers(
  params: AdminUsersQueryParams = {}
): Promise<AdminUsersPage> {
  const { data } = await apiClient.get<PaginatedResponse<AdminUser>>(
    "/admin-panel/users/",
    { params }
  );
  return { users: data.data, pagination: data.pagination };
}

export async function getAdminUserById(userId: number): Promise<AdminUser> {
  const { data } = await apiClient.get<ApiResponse<AdminUser>>(
    `/admin-panel/users/${userId}/`
  );
  return data.data;
}

export async function updateAdminUser(
  userId: number,
  payload: AdminUserUpdatePayload
): Promise<AdminUser> {
  const { data } = await apiClient.patch<ApiResponse<AdminUser>>(
    `/admin-panel/users/${userId}/`,
    payload
  );
  return data.data;
}

export async function deleteAdminUser(userId: number): Promise<void> {
  await apiClient.delete<ApiResponse<Record<string, never>>>(
    `/admin-panel/users/${userId}/`
  );
}

export async function suspendAdminUser(userId: number): Promise<AdminUser> {
  const { data } = await apiClient.post<ApiResponse<AdminUser>>(
    `/admin-panel/users/${userId}/suspend/`
  );
  return data.data;
}

export async function unsuspendAdminUser(userId: number): Promise<AdminUser> {
  const { data } = await apiClient.post<ApiResponse<AdminUser>>(
    `/admin-panel/users/${userId}/unsuspend/`
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Membership Plans
// ---------------------------------------------------------------------------

export async function getAdminMembershipPlans(): Promise<AdminMembershipPlan[]> {
  const { data } = await apiClient.get<ApiResponse<AdminMembershipPlan[]>>(
    "/admin-panel/plans/"
  );
  return data.data;
}

export async function createAdminMembershipPlan(
  payload: AdminMembershipPlanPayload
): Promise<AdminMembershipPlan> {
  const { data } = await apiClient.post<ApiResponse<AdminMembershipPlan>>(
    "/admin-panel/plans/",
    payload
  );
  return data.data;
}

export async function updateAdminMembershipPlan(
  planId: number,
  payload: AdminMembershipPlanUpdatePayload
): Promise<AdminMembershipPlan> {
  const { data } = await apiClient.patch<ApiResponse<AdminMembershipPlan>>(
    `/admin-panel/plans/${planId}/`,
    payload
  );
  return data.data;
}

export async function deleteAdminMembershipPlan(planId: number): Promise<void> {
  await apiClient.delete<ApiResponse<Record<string, never>>>(
    `/admin-panel/plans/${planId}/`
  );
}

// ---------------------------------------------------------------------------
// Invitation Templates
// ---------------------------------------------------------------------------

export async function getAdminInvitationTemplates(): Promise<AdminInvitationTemplate[]> {
  const { data } = await apiClient.get<ApiResponse<AdminInvitationTemplate[]>>(
    "/admin-panel/templates/"
  );
  return data.data;
}

function buildTemplateFormData(
  payload: AdminInvitationTemplatePayload | AdminInvitationTemplateUpdatePayload
): FormData {
  const formData = new FormData();

  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.description !== undefined) formData.append("description", payload.description);
  if (payload.is_active !== undefined) formData.append("is_active", String(payload.is_active));
  if (payload.display_order !== undefined)
    formData.append("display_order", String(payload.display_order));
  if (payload.preview_image) formData.append("preview_image", payload.preview_image);
  if (payload.background_image) formData.append("background_image", payload.background_image);

  return formData;
}

export async function createAdminInvitationTemplate(
  payload: AdminInvitationTemplatePayload
): Promise<AdminInvitationTemplate> {
  const { data } = await apiClient.post<ApiResponse<AdminInvitationTemplate>>(
    "/admin-panel/templates/",
    buildTemplateFormData(payload),
    { headers: { "Content-Type": undefined } }
  );
  return data.data;
}

export async function updateAdminInvitationTemplate(
  templateId: number,
  payload: AdminInvitationTemplateUpdatePayload
): Promise<AdminInvitationTemplate> {
  const { data } = await apiClient.patch<ApiResponse<AdminInvitationTemplate>>(
    `/admin-panel/templates/${templateId}/`,
    buildTemplateFormData(payload),
    { headers: { "Content-Type": undefined } }
  );
  return data.data;
}

export async function deleteAdminInvitationTemplate(templateId: number): Promise<void> {
  await apiClient.delete<ApiResponse<Record<string, never>>>(
    `/admin-panel/templates/${templateId}/`
  );
}

// ---------------------------------------------------------------------------
// Gallery Media
// ---------------------------------------------------------------------------

export interface AdminMediaPage {
  media: AdminGalleryMedia[];
  pagination: PaginationMeta;
}

export async function getAdminMedia(
  params: AdminMediaQueryParams = {}
): Promise<AdminMediaPage> {
  const { data } = await apiClient.get<PaginatedResponse<AdminGalleryMedia>>(
    "/admin-panel/media/",
    { params }
  );
  return { media: data.data, pagination: data.pagination };
}

export async function deleteAdminMedia(mediaId: number): Promise<void> {
  await apiClient.delete<ApiResponse<Record<string, never>>>(
    `/admin-panel/media/${mediaId}/`
  );
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function getAdminReports(): Promise<AdminReports> {
  const { data } = await apiClient.get<ApiResponse<AdminReports>>(
    "/admin-panel/reports/"
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Phase 26: platform channel pools
// ---------------------------------------------------------------------------

export async function getAdminChannelPools(): Promise<PlatformChannelPool[]> {
  const { data } = await apiClient.get<ApiResponse<PlatformChannelPool[]>>(
    "/admin-panel/channel-pools/"
  );
  return data.data;
}

export async function topupAdminChannelPool(
  payload: PlatformPoolTopupPayload
): Promise<PlatformChannelPool> {
  const { data } = await apiClient.post<ApiResponse<PlatformChannelPool>>(
    "/admin-panel/channel-pools/topup/",
    payload
  );
  return data.data;
}

export async function getAdminChannelPoolTopupHistory(
  channel?: InvitationChannelKey
): Promise<PlatformPoolTopup[]> {
  const { data } = await apiClient.get<ApiResponse<PlatformPoolTopup[]>>(
    "/admin-panel/channel-pools/topup-history/",
    { params: channel ? { channel } : {} }
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Phase 26: topup pack administration
// ---------------------------------------------------------------------------

export async function getAdminTopupPacks(): Promise<AdminTopupPack[]> {
  const { data } = await apiClient.get<ApiResponse<AdminTopupPack[]>>(
    "/admin-panel/topup-packs/"
  );
  return data.data;
}

export async function createAdminTopupPack(
  payload: AdminTopupPackPayload
): Promise<AdminTopupPack> {
  const { data } = await apiClient.post<ApiResponse<AdminTopupPack>>(
    "/admin-panel/topup-packs/",
    payload
  );
  return data.data;
}

export async function updateAdminTopupPack(
  packId: number,
  payload: AdminTopupPackUpdatePayload
): Promise<AdminTopupPack> {
  const { data } = await apiClient.patch<ApiResponse<AdminTopupPack>>(
    `/admin-panel/topup-packs/${packId}/`,
    payload
  );
  return data.data;
}

export async function deactivateAdminTopupPack(packId: number): Promise<AdminTopupPack> {
  const { data } = await apiClient.delete<ApiResponse<AdminTopupPack>>(
    `/admin-panel/topup-packs/${packId}/`
  );
  return data.data;
}
export type { AdminMediaQueryParams, AdminUsersQueryParams };
