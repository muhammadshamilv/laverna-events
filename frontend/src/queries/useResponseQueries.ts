import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getInvitationByToken, submitGuestResponse } from "@/api/responses.api";
import type { SubmitResponsePayload } from "@/types/response.types";

export const responseKeys = {
  all: ["invitation-response"] as const,
  detail: (token: string) => ["invitation-response", token] as const,
};

export function useInvitationByToken(responseToken: string | undefined) {
  return useQuery({
    queryKey: responseKeys.detail(responseToken ?? ""),
    queryFn: () => getInvitationByToken(responseToken as string),
    enabled: !!responseToken,
    // A guessed/invalid token 404s forever - retrying it just delays
    // showing the "invalid link" state to the guest.
    retry: false,
  });
}

export function useSubmitGuestResponse(responseToken: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitResponsePayload) =>
      submitGuestResponse(responseToken as string, payload),
    onSuccess: () => {
      if (responseToken) {
        queryClient.invalidateQueries({ queryKey: responseKeys.detail(responseToken) });
      }
    },
  });
}