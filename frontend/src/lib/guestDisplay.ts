import type { InvitationStatus, ResponseStatus } from "@/types/guest.types";

export const RESPONSE_STATUS_BADGE_CLASS: Record<ResponseStatus, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  MAYBE: "bg-amber-100 text-amber-700",
};

export const RESPONSE_STATUS_LABEL: Record<ResponseStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Declined",
  MAYBE: "Maybe",
};

export const INVITATION_STATUS_LABEL: Record<InvitationStatus, string> = {
  NOT_SENT: "Not sent",
  SENT: "Sent",
  FAILED: "Failed",
};
