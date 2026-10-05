import { apiClient } from "./client";
import type { ApiResponse } from "@/types/api.types";
import type {
  LoginPayload,
  RegisterPayload,
  ResendOtpPayload,
  User,
  VerifyMobilePayload,
  VerifyMobileResult,
} from "@/types/auth.types";

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const { data } = await apiClient.post<ApiResponse<User>>(
    "/auth/register/",
    payload
  );
  return data.data;
}

export async function loginUser(payload: LoginPayload): Promise<User> {
  const { data } = await apiClient.post<ApiResponse<{ user: User }>>(
    "/auth/login/",
    payload
  );
  return data.data.user;
}

export async function logoutUser(): Promise<void> {
  await apiClient.post<ApiResponse<Record<string, never>>>("/auth/logout/");
}

export async function verifyMobile(
  payload: VerifyMobilePayload
): Promise<VerifyMobileResult> {
  const { data } = await apiClient.post<ApiResponse<VerifyMobileResult>>(
    "/auth/verify-mobile/",
    payload
  );
  return data.data;
}

export async function resendOtp(payload: ResendOtpPayload): Promise<void> {
  await apiClient.post<ApiResponse<Record<string, never>>>(
    "/auth/resend-otp/",
    payload
  );
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>("/auth/me/");
  return data.data;
}
