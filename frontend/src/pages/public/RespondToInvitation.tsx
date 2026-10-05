import { useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  HelpCircle,
  MapPin,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvitationByToken, useSubmitGuestResponse } from "@/queries/useResponseQueries";
import { EVENT_TYPE_OPTIONS } from "@/types/event.types";
import { formatEventDate, formatEventTime } from "@/lib/eventDisplay";
import { resolveMediaUrl } from "@/lib/media";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import type { GuestResponseStatus } from "@/types/response.types";

function eventTypeLabel(type: string): string {
  return EVENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

const STATUS_META: Record<
  GuestResponseStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  ACCEPTED: {
    label: "You're going",
    icon: CheckCircle2,
    className: "badge-success",
  },
  REJECTED: {
    label: "You declined",
    icon: XCircle,
    className: "bg-rose-100 text-rose-700",
  },
  MAYBE: {
    label: "You might attend",
    icon: HelpCircle,
    className: "badge-gold",
  },
  PENDING: {
    label: "Awaiting your response",
    icon: HelpCircle,
    className: "bg-slate-100 text-slate-600",
  },
};

const RESPONSE_OPTIONS: {
  value: "ACCEPTED" | "MAYBE" | "REJECTED";
  label: string;
  icon: typeof CheckCircle2;
  activeClass: string;
}[] = [
  {
    value: "ACCEPTED",
    label: "Accept",
    icon: CheckCircle2,
    activeClass: "bg-[var(--brand-green)] text-white hover:bg-[var(--brand-green-dark)]",
  },
  {
    value: "MAYBE",
    label: "Maybe",
    icon: HelpCircle,
    activeClass: "bg-[var(--brand-gold)] text-white hover:bg-[#c99a06]",
  },
  {
    value: "REJECTED",
    label: "Decline",
    icon: XCircle,
    activeClass: "bg-rose-500 text-white hover:bg-rose-600",
  },
];

export default function RespondToInvitation() {
  const { token } = useParams<{ token: string }>();

  const { data: invitation, isLoading, isError, error } = useInvitationByToken(token);
  const submitMutation = useSubmitGuestResponse(token);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selected, setSelected] = useState<"ACCEPTED" | "MAYBE" | "REJECTED" | null>(null);

  const handleRespond = (value: "ACCEPTED" | "MAYBE" | "REJECTED") => {
    setSelected(value);
    setSubmitError(null);

    submitMutation.mutate(
      { response: value },
      {
        onError: (err) => {
          setSubmitError(getApiErrorMessage(err, "Couldn't submit your response. Please try again."));
          setSelected(null);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 py-10"
        style={{ background: "var(--gradient-brand-soft)" }}
      >
        <Card className="w-full max-w-md overflow-hidden">
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      </div>
    );
  }

  if (isError || !invitation) {
    const message = getApiErrorMessage(
      error,
      "This invitation link is invalid or has expired."
    );

    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 py-10"
        style={{ background: "var(--gradient-brand-soft)" }}
      >
        <Card className="w-full max-w-md p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-bold text-[var(--brand-navy)]">
            Invitation not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
        </Card>
      </div>
    );
  }

  const imageUrl = resolveMediaUrl(invitation.invitation_image);
  const alreadyResponded = invitation.already_responded;
  const currentStatus = selected
    ? ({ response_status: selected } as { response_status: GuestResponseStatus }).response_status
    : invitation.response_status;
  const statusMeta = STATUS_META[currentStatus];

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10 sm:py-16"
      style={{ background: "var(--gradient-brand-soft)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden">
          <div className="relative flex h-48 items-center justify-center bg-slate-100 sm:h-56">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={invitation.event_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                <CalendarDays className="h-10 w-10 text-white/40" />
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-pink)]">
              {eventTypeLabel(invitation.event_type)}
            </p>
            <h1 className="mt-1 text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">
              {invitation.event_name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Hi {invitation.guest_name}, you're invited!</p>

            <div className="mt-5 space-y-2.5 rounded-2xl bg-[var(--surface-muted)] p-4">
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                {formatEventDate(invitation.event_date)}
              </div>
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                {formatEventTime(invitation.event_time)}
              </div>
              {invitation.venue_name && (
                <div className="flex items-start gap-2.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                  <span>
                    {invitation.venue_name}
                    {invitation.address && ` - ${invitation.address}`}
                  </span>
                </div>
              )}
              {invitation.google_maps_link && (
                <a
                  href={invitation.google_maps_link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-sm font-medium text-[var(--brand-pink)]"
                >
                  <MapPin className="h-4 w-4 shrink-0" />
                  View on Google Maps
                </a>
              )}
            </div>

            {/* Phase 23: guest-facing "Add to Calendar" - a direct .ics
                download, available regardless of response status, so a
                guest can save the date before or after answering. */}
            <a
              href={invitation.calendar_url}
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-[var(--brand-navy)] transition-colors hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)]"
            >
              <CalendarPlus className="h-4 w-4" />
              Add to calendar
            </a>

            {(alreadyResponded || submitMutation.isSuccess) ? (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-100 p-4">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    statusMeta.className
                  )}
                >
                  <statusMeta.icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-[var(--brand-navy)]">
                  {statusMeta.label}
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-600">Will you be attending?</p>

                {submitError && (
                  <p className="mt-2 text-sm text-rose-600" role="alert">
                    {submitError}
                  </p>
                )}

                <div className="mt-3 grid grid-cols-3 gap-2.5">
                  {RESPONSE_OPTIONS.map((option) => {
                    const isPending =
                      submitMutation.isPending && selected === option.value;

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant="outline"
                        isLoading={isPending}
                        disabled={submitMutation.isPending}
                        onClick={() => handleRespond(option.value)}
                        className={cn(
                          "h-auto flex-col gap-1.5 py-3.5 text-xs font-semibold",
                          selected === option.value && option.activeClass
                        )}
                      >
                        {!isPending && <option.icon className="h-5 w-5" />}
                        {option.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-slate-400">
          Sent with LavernaEvents
        </p>
      </motion.div>
    </div>
  );
}