import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  resendOtp,
  verifyMobile,
} from "@/api/auth.api";
import { authStore } from "@/stores/auth.store";
import type {
  LoginPayload,
  RegisterPayload,
  ResendOtpPayload,
  User,
  VerifyMobilePayload,
} from "@/types/auth.types";

export const authKeys = {
  currentUser: ["auth", "current-user"] as const,
};

export function useCurrentUser() {
  const query = useQuery<User | null>({
    queryKey: authKeys.currentUser,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.isSuccess) {
      authStore.setUser(query.data);
      authStore.setChecking(false);
    } else if (query.isError) {
      authStore.setUser(null);
      authStore.setChecking(false);
    }
  }, [query.isSuccess, query.isError, query.data]);

  return query;
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: (user: User) => {
      queryClient.setQueryData(authKeys.currentUser, user);
      authStore.setUser(user);
      authStore.setChecking(false);
    },
  });
}

function clearLocalSession(queryClient: ReturnType<typeof useQueryClient>) {
  // Overwrite the cached value in place rather than removeQueries():
  // removeQueries() deletes the cache entry outright, and since
  // SessionBootstrap keeps an active useCurrentUser() observer mounted
  // for the app's whole lifetime, that immediately triggers a refetch -
  // which then 401s again and can spiral. setQueryData() just updates
  // the value without provoking a new network request.
  queryClient.setQueryData(authKeys.currentUser, null);
  authStore.setUser(null);
  authStore.setChecking(false);
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => clearLocalSession(queryClient),
    // Sign-out clears LOCAL session state unconditionally, even if the
    // network call itself fails (offline, a stray 500, or a 401 that
    // - now that /auth/logout/ is excluded from the refresh-retry
    // interceptor in client.ts - is allowed to just fail rather than
    // silently re-authenticating the user). From the person's
    // perspective, clicking "Sign out" must always log them out on this
    // device immediately; the server call is best-effort cleanup of the
    // refresh-token blacklist, not a precondition for the client
    // forgetting who's logged in.
    onError: () => clearLocalSession(queryClient),
  });
}

export function useVerifyMobileMutation() {
  return useMutation({
    mutationFn: (payload: VerifyMobilePayload) => verifyMobile(payload),
  });
}

export function useResendOtpMutation() {
  return useMutation({
    mutationFn: (payload: ResendOtpPayload) => resendOtp(payload),
  });
}