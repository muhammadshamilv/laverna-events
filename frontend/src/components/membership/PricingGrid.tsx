import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  HardDrive,
  Images,
  LayoutTemplate,
  Mail,
  PhoneCall,
  Tag,
  Users,
  X,
} from "lucide-react";
import { Card, FormError } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useChangePlanMutation,
  useMySubscription,
  usePlans,
  useSubscribeMutation,
} from "@/queries/useMembershipQueries";
import { useCreateCheckoutSessionMutation } from "@/queries/usePaymentQueries";
import { useAuthStore } from "@/stores/auth.store";
import { formatPrice, formatStorage } from "@/lib/format";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import type { MembershipPlan } from "@/types/membership.types";

function FeatureRow({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {enabled ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <X className="h-4 w-4 shrink-0 text-slate-300" />
      )}
      <span className={enabled ? "text-slate-600" : "text-slate-400"}>{label}</span>
    </div>
  );
}

function QuotaRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function PlanCardBody({
  plan,
  isCurrentPlan,
  isHighlighted,
  onSelect,
  isPending,
  cardError,
  loggedOut,
}: {
  plan: MembershipPlan;
  isCurrentPlan: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  isPending: boolean;
  cardError: string | null;
  loggedOut: boolean;
}) {
  const isFree = Number(plan.price) === 0;

  const totalInvitations = plan.total_invitations ?? 0;
  const templateLimit = plan.template_limit ?? 0;
  const voiceCallLimit = plan.voice_call_limit ?? 0;

  return (
    <>
      {isCurrentPlan ? (
        <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full badge-success px-3 py-1 text-xs font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Current plan
        </span>
      ) : (
        isHighlighted && (
          <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-[var(--brand-pink)]/10 px-3 py-1 text-xs font-semibold text-[var(--brand-pink)]">
            <BadgeCheck className="h-3.5 w-3.5" />
            Recommended
          </span>
        )
      )}

      <h3 className="text-lg font-semibold text-[var(--brand-navy)]">{plan.name}</h3>
      <p className="mt-2 text-2xl font-bold text-[var(--brand-navy)] sm:mt-3 sm:text-3xl">
        {formatPrice(plan.price)}
        {!isFree && (
          <span className="text-sm font-medium text-slate-400 sm:text-base">
            {" "}
            / {plan.duration_days} days
          </span>
        )}
      </p>
      {plan.description && <p className="mt-2 text-sm text-slate-500 sm:mt-3">{plan.description}</p>}

      <div className="mt-5 space-y-2 sm:mt-6 sm:space-y-2.5">
        <QuotaRow icon={<Users className="h-4 w-4" />}>Up to {plan.guest_limit} guests</QuotaRow>
        <QuotaRow icon={<CalendarDays className="h-4 w-4" />}>
          {plan.event_limit} active event{plan.event_limit === 1 ? "" : "s"}
        </QuotaRow>
        <QuotaRow icon={<HardDrive className="h-4 w-4" />}>
          {formatStorage(plan.storage_limit_mb)} storage
        </QuotaRow>
        <QuotaRow icon={<Mail className="h-4 w-4" />}>
          {totalInvitations} invitation{totalInvitations === 1 ? "" : "s"} included
        </QuotaRow>
        <QuotaRow icon={<LayoutTemplate className="h-4 w-4" />}>
          {templateLimit > 0
            ? `${templateLimit} invitation template${templateLimit === 1 ? "" : "s"}`
            : "No templates included"}
        </QuotaRow>
        <QuotaRow icon={<PhoneCall className="h-4 w-4" />}>
          {voiceCallLimit > 0
            ? `${voiceCallLimit} voice call${voiceCallLimit === 1 ? "" : "s"}`
            : "No voice calls included"}
        </QuotaRow>
      </div>

      <div className="mt-5 space-y-2 border-t border-slate-100 pt-5 sm:mt-6 sm:pt-6">
        <FeatureRow enabled={plan.gallery_enabled} label="Photo gallery" />
        <FeatureRow enabled={plan.qr_code_enabled} label="QR guest passes" />
        <FeatureRow enabled={plan.photographer_access_enabled} label="Photographer access" />
      </div>

      <div className="mt-6 sm:mt-8">
        {loggedOut ? (
          <Link
            to={`/register?plan=${plan.slug}`}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--brand-pink)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-pink-dark)] sm:h-11"
          >
            Get started
          </Link>
        ) : isCurrentPlan ? (
          <Button className="w-full" variant="outline" disabled>
            <CheckCircle2 className="h-4 w-4" />
            Current plan
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isFree ? "primary" : "navy"}
            isLoading={isPending}
            onClick={onSelect}
          >
            {isFree ? "Select this plan" : "Choose plan"}
          </Button>
        )}
        {cardError && <FormError message={cardError} />}
      </div>
    </>
  );
}

export default function PricingGrid() {
  const { data: plans, isLoading, isError } = usePlans();
  const { data: subscription } = useMySubscription();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightedSlug = searchParams.get("plan");

  const subscribeMutation = useSubscribeMutation();
  const changePlanMutation = useChangePlanMutation();
  const checkoutMutation = useCreateCheckoutSessionMutation();

  const currentPlanSlug =
    subscription && subscription.status === "ACTIVE" ? subscription.plan.slug : null;
  const hasActivePlan = !!currentPlanSlug;

  const handleSelectPlan = (plan: MembershipPlan) => {
    const isFree = Number(plan.price) === 0;

    // Switching between plans once already subscribed goes through
    // change-plan (prorates/swaps in place on the backend), not
    // subscribe (first-time activation) or checkout (which would charge
    // full price again for a plan the user may just be downgrading to).
    if (hasActivePlan) {
      changePlanMutation.mutate(plan.slug, {
        onSuccess: () => navigate("/portal"),
      });
      return;
    }

    if (isFree) {
      subscribeMutation.mutate(plan.slug, {
        onSuccess: () => navigate("/portal"),
      });
    } else {
      checkoutMutation.mutate(plan.slug, {
        onSuccess: (result) => {
          window.location.href = result.checkout_url;
        },
      });
    }
  };

  return (
    <div className="gradient-mesh-subtle mobile-safe-bottom min-h-[70vh] px-4 pb-10 pt-12 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-pink)]/10 text-[var(--brand-pink)] sm:h-14 sm:w-14">
          <Tag className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-[var(--brand-navy)] sm:mt-6 sm:text-4xl">
          Pricing
        </h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 sm:mt-4 sm:max-w-xl">
          Choose the plan that fits how you're planning. Upgrade any time as your event grows.
        </p>

        {isError && (
          <p className="mt-8 text-sm text-rose-600 sm:mt-10">
            Couldn't load plans right now. Please refresh the page.
          </p>
        )}

        {/* Mobile: horizontal snap-scroll carousel. Desktop: static grid.
            Both read from the exact same `plans` data and render the same
            PlanCardBody, so "current plan" state can never disagree
            between the two. */}
        <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:mt-14 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <Card
                key={index}
                className="w-[85vw] shrink-0 snap-center p-6 text-left sm:w-auto sm:p-8"
              >
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-4 h-9 w-32" />
                <Skeleton className="mt-6 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
                <Skeleton className="mt-8 h-11 w-full rounded-full" />
              </Card>
            ))}

          {!isLoading &&
            plans?.map((plan) => {
              const isCurrentPlan = plan.slug === currentPlanSlug;
              const isHighlighted = plan.slug === highlightedSlug;
              const isPending =
                (subscribeMutation.isPending && subscribeMutation.variables === plan.slug) ||
                (changePlanMutation.isPending && changePlanMutation.variables === plan.slug) ||
                (checkoutMutation.isPending && checkoutMutation.variables === plan.slug);
              const cardError =
                (subscribeMutation.isError && subscribeMutation.variables === plan.slug
                  ? getApiErrorMessage(subscribeMutation.error, "Couldn't select this plan.")
                  : null) ??
                (changePlanMutation.isError && changePlanMutation.variables === plan.slug
                  ? getApiErrorMessage(changePlanMutation.error, "Couldn't change plan.")
                  : null) ??
                (checkoutMutation.isError && checkoutMutation.variables === plan.slug
                  ? getApiErrorMessage(checkoutMutation.error, "Couldn't start checkout.")
                  : null);

              return (
                <Card
                  key={plan.slug}
                  className={cn(
                    "w-[85vw] shrink-0 snap-center p-6 text-left sm:w-auto sm:flex sm:h-full sm:flex-col sm:p-8",
                    isCurrentPlan
                      ? "border-2 border-[var(--brand-green)] soft-shadow-lg"
                      : isHighlighted && "border-2 border-[var(--brand-pink)] soft-shadow-lg"
                  )}
                >
                  <PlanCardBody
                    plan={plan}
                    isCurrentPlan={isCurrentPlan}
                    isHighlighted={isHighlighted}
                    onSelect={() => handleSelectPlan(plan)}
                    isPending={isPending}
                    cardError={cardError}
                    loggedOut={!user}
                  />
                </Card>
              );
            })}
        </div>

        {!isLoading && plans && plans.length === 0 && (
          <p className="mt-8 text-sm text-slate-500 sm:mt-10">
            No plans are available right now. Check back soon.
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400 sm:mt-12">
          <Camera className="h-4 w-4" />
          <Images className="h-4 w-4" />
          All plans include secure event photo storage.
        </div>
      </div>
    </div>
  );
}