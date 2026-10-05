import { AlertTriangle, IndianRupee, Mail, MessageSquare, Phone } from "lucide-react";
import { Card, FormError } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyUsage, useTopupPacks } from "@/queries/useMembershipQueries";
import { useCreateTopupCheckoutSessionMutation } from "@/queries/usePaymentQueries";
import { getApiErrorMessage } from "@/lib/apiError";
import type { TopupPack } from "@/types/membership.types";

function UsageBar({
  label,
  used,
  topup,
  total,
  remaining,
  icon: Icon,
}: {
  label: string;
  used: number | null;
  topup: number | null;
  total: number | null;
  remaining: number | null;
  icon: React.ElementType;
}) {
  const isUnlimited = total === null;
  const safeUsed = used ?? 0;
  const safeTopup = topup ?? 0;
  const effectiveTotal = isUnlimited ? null : (total ?? 0) + safeTopup;
  const pct =
    effectiveTotal && effectiveTotal > 0 ? Math.min((safeUsed / effectiveTotal) * 100, 100) : 0;
  const isLow = !isUnlimited && remaining !== null && effectiveTotal ? remaining / effectiveTotal < 0.1 : false;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <p className="text-sm font-semibold text-[var(--brand-navy)]">{label}</p>
      </div>

      {isUnlimited ? (
        <p className="mt-3 text-sm text-slate-500">Unlimited</p>
      ) : (
        <>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: isLow ? "#dc2626" : "#0f766e" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {safeUsed.toLocaleString()} used of {effectiveTotal?.toLocaleString()}
              {safeTopup > 0 && (
                <span className="text-slate-400"> (incl. {safeTopup.toLocaleString()} topup)</span>
              )}
            </span>
            <span className={isLow ? "font-semibold text-rose-600" : ""}>
              {(remaining ?? 0).toLocaleString()} left
            </span>
          </div>
          {isLow && (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Running low - consider buying a topup pack below.
            </p>
          )}
        </>
      )}
    </Card>
  );
}

function TopupPackCard({ pack }: { pack: TopupPack }) {
  const checkoutMutation = useCreateTopupCheckoutSessionMutation();

  const handleBuy = () => {
    checkoutMutation.mutate(pack.id, {
      onSuccess: (result) => {
        window.location.href = result.checkout_url;
      },
    });
  };

  const Icon = pack.kind === "VOICE_CALLS" ? Phone : MessageSquare;

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {pack.kind === "VOICE_CALLS" ? "Voice Calls" : "Invitations"}
        </p>
      </div>
      <h3 className="mt-2 font-bold text-[var(--brand-navy)]">{pack.name}</h3>
      <p className="mt-1 text-sm text-slate-500">
        +{pack.quantity.toLocaleString()} {pack.kind === "VOICE_CALLS" ? "calls" : "invitations"}
      </p>
      <p className="mt-3 flex items-center text-2xl font-bold text-[var(--brand-navy)]">
        <IndianRupee className="h-5 w-5" />
        {pack.price}
      </p>

      <div className="mt-4 flex-1" />

      <Button className="mt-4 w-full" isLoading={checkoutMutation.isPending} onClick={handleBuy}>
        Buy this pack
      </Button>
      {checkoutMutation.isError && (
        <FormError message={getApiErrorMessage(checkoutMutation.error, "Couldn't start checkout.")} />
      )}
    </Card>
  );
}

export default function Billing() {
  const { data: usage, isLoading: usageLoading, isError: usageError } = useMyUsage();
  const { data: packs, isLoading: packsLoading, isError: packsError } = useTopupPacks();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--brand-navy)]">Billing & Usage</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your plan's quotas and buy a topup pack if you need more.
        </p>
      </div>

      {usageError ? (
        <Card className="mb-6 p-6 text-center text-sm text-slate-500">
          We couldn't load your usage right now. Please refresh the page.
        </Card>
      ) : usageLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      ) : usage ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UsageBar
            label="Invitations"
            used={usage.invitations_used}
            topup={usage.invitations_topup}
            total={usage.total_invitations}
            remaining={usage.invitations_remaining}
            icon={Mail}
          />
          <UsageBar
            label="Voice Calls"
            used={usage.voice_calls_used}
            topup={usage.voice_calls_topup}
            total={usage.voice_call_limit}
            remaining={usage.voice_calls_remaining}
            icon={Phone}
          />
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="text-lg font-bold text-[var(--brand-navy)]">Buy a topup pack</h2>
        <p className="mt-1 text-sm text-slate-500">
          Topup packs add extra invitations or voice calls on top of your plan's limits. They
          never expire and stack with your current plan.
        </p>

        {packsError ? (
          <Card className="mt-4 p-6 text-center text-sm text-slate-500">
            We couldn't load topup packs right now. Please refresh the page.
          </Card>
        ) : packsLoading ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-3xl" />
            ))}
          </div>
        ) : packs && packs.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <TopupPackCard key={pack.id} pack={pack} />
            ))}
          </div>
        ) : (
          <Card className="mt-4 p-6 text-center text-sm text-slate-500">
            No topup packs are available right now.
          </Card>
        )}
      </div>
    </div>
  );
}