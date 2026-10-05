import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api.types";
import type {
  ChangePlanResult,
  MembershipPlan,
  PortalAccess,
  Subscription,
  TopupPack,
  UsageSummary,
} from "@/types/membership.types";

export async function getPlans(): Promise<MembershipPlan[]> {
  const { data } = await apiClient.get<ApiResponse<MembershipPlan[]>>(
    "/memberships/plans/"
  );
  return data.data;
}

export async function getPlanBySlug(slug: string): Promise<MembershipPlan> {
  const { data } = await apiClient.get<ApiResponse<MembershipPlan>>(
    `/memberships/plans/${slug}/`
  );
  return data.data;
}

export async function getMySubscription(): Promise<Subscription | null> {
  const { data } = await apiClient.get<ApiResponse<Subscription | null>>(
    "/memberships/my-subscription/"
  );
  return data.data;
}

export async function getMyUsage(): Promise<UsageSummary> {
  const { data } = await apiClient.get<ApiResponse<UsageSummary>>(
    "/memberships/my-usage/"
  );
  return data.data;
}

export async function getPortalAccess(): Promise<PortalAccess> {
  const { data } = await apiClient.get<ApiResponse<PortalAccess>>(
    "/memberships/portal-access/"
  );
  return data.data;
}

export async function subscribeToPlan(planSlug: string): Promise<Subscription> {
  const { data } = await apiClient.post<ApiResponse<Subscription>>(
    "/memberships/subscribe/",
    { plan_slug: planSlug }
  );
  return data.data;
}

export async function changePlan(planSlug: string): Promise<ChangePlanResult> {
  const { data } = await apiClient.post<ApiResponse<ChangePlanResult>>(
    "/memberships/change-plan/",
    { plan_slug: planSlug }
  );
  return data.data;
}

// ---------------------------------------------------------------------------
// Phase 26: organizer-facing topup packs
// ---------------------------------------------------------------------------

export async function getTopupPacks(): Promise<TopupPack[]> {
  const { data } = await apiClient.get<ApiResponse<TopupPack[]>>(
    "/memberships/topup-packs/"
  );
  return data.data;
}