import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createCheckoutSession,
  createTopupCheckoutSession,
  getPaymentStatus,
  getTopupPurchaseStatus,
} from "@/api/payments.api";
import type { Payment, TopupPurchase } from "@/types/payment.types";

export function useCreateCheckoutSessionMutation() {
  return useMutation({
    mutationFn: (planSlug: string) => createCheckoutSession(planSlug),
  });
}

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 8;

interface PaymentStatusPollingResult {
  payment: Payment | null;
  isPolling: boolean;
  hasTimedOut: boolean;
}

export function usePaymentStatusPolling(
  sessionId: string | undefined
): PaymentStatusPollingResult {
  const [attempts, setAttempts] = useState(0);

  const query = useQuery<Payment>({
    queryKey: ["payments", "status", sessionId],
    queryFn: async () => {
      const result = await getPaymentStatus(sessionId as string);
      setAttempts((prev) => prev + 1);
      return result;
    },
    enabled: !!sessionId,
    retry: false,
    refetchInterval: (currentQuery) => {
      const currentStatus = currentQuery.state.data?.status;
      const settled = currentStatus === "PAID" || currentStatus === "FAILED";
      const exhausted = attempts >= MAX_ATTEMPTS;
      return settled || exhausted ? false : POLL_INTERVAL_MS;
    },
  });

  const settled = query.data?.status === "PAID" || query.data?.status === "FAILED";
  const hasTimedOut = !!sessionId && !settled && attempts >= MAX_ATTEMPTS;
  const isPolling = !!sessionId && !settled && !hasTimedOut;

  return {
    payment: query.data ?? null,
    isPolling,
    hasTimedOut,
  };
}

// ---------------------------------------------------------------------------
// Phase 26: organizer topup pack purchases
// ---------------------------------------------------------------------------

export function useCreateTopupCheckoutSessionMutation() {
  return useMutation({
    mutationFn: (packId: number) => createTopupCheckoutSession(packId),
  });
}

interface TopupPurchaseStatusPollingResult {
  purchase: TopupPurchase | null;
  isPolling: boolean;
  hasTimedOut: boolean;
}

export function useTopupPurchaseStatusPolling(
  sessionId: string | undefined
): TopupPurchaseStatusPollingResult {
  const [attempts, setAttempts] = useState(0);

  const query = useQuery<TopupPurchase>({
    queryKey: ["payments", "topup-status", sessionId],
    queryFn: async () => {
      const result = await getTopupPurchaseStatus(sessionId as string);
      setAttempts((prev) => prev + 1);
      return result;
    },
    enabled: !!sessionId,
    retry: false,
    refetchInterval: (currentQuery) => {
      const currentStatus = currentQuery.state.data?.status;
      const settled = currentStatus === "PAID" || currentStatus === "FAILED";
      const exhausted = attempts >= MAX_ATTEMPTS;
      return settled || exhausted ? false : POLL_INTERVAL_MS;
    },
  });

  const settled = query.data?.status === "PAID" || query.data?.status === "FAILED";
  const hasTimedOut = !!sessionId && !settled && attempts >= MAX_ATTEMPTS;
  const isPolling = !!sessionId && !settled && !hasTimedOut;

  return {
    purchase: query.data ?? null,
    isPolling,
    hasTimedOut,
  };
}