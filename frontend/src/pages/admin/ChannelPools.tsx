import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, History, PlusCircle } from "lucide-react";
import { Card, FormError } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/apiError";
import { toastStore } from "@/stores/toast.store";
import {
  useAdminChannelPoolTopupHistory,
  useAdminChannelPools,
  useTopupAdminChannelPoolMutation,
} from "@/queries/useAdminQueries";
import type { InvitationChannelKey, PlatformChannelPool } from "@/types/admin.types";

const topupSchema = z.object({
  channel: z.enum(["WHATSAPP", "EMAIL", "SMS", "VOICE_CALL"]),
  amount: z.string().min(1, "Amount is required"),
  note: z.string().optional(),
});

type TopupFormValues = z.infer<typeof topupSchema>;

const CHANNEL_OPTIONS: { value: InvitationChannelKey; label: string }[] = [
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "VOICE_CALL", label: "Voice Call" },
];

function TopupFormDialog({
  defaultChannel,
  onClose,
}: {
  defaultChannel: InvitationChannelKey;
  onClose: () => void;
}) {
  const topupMutation = useTopupAdminChannelPoolMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TopupFormValues>({
    resolver: zodResolver(topupSchema),
    defaultValues: {
      channel: defaultChannel,
      amount: "",
      note: "",
    },
  });

  const onSubmit = (values: TopupFormValues) => {
    topupMutation.mutate(
      {
        channel: values.channel,
        amount: Number(values.amount),
        note: values.note || "",
      },
      {
        onSuccess: () => {
          toastStore.show("Pool topped up.");
          onClose();
        },
        onError: (error) => {
          toastStore.show(getApiErrorMessage(error, "Could not top up pool."), "error");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <Card className="relative w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-[var(--brand-navy)]">Top up channel pool</h2>
        <p className="mt-1 text-sm text-slate-500">
          Increases the platform-wide capacity for this channel. This is separate from any
          organizer's own plan quota.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="channel">Channel</Label>
            <select
              id="channel"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              {...register("channel")}
            >
              {CHANNEL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount to add</Label>
            <Input id="amount" type="number" hasError={!!errors.amount} {...register("amount")} />
            <FormError message={errors.amount?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" placeholder="e.g. Monthly Twilio top-up" {...register("note")} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={topupMutation.isPending}>
              Top up
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function HistoryDialog({
  channel,
  onClose,
}: {
  channel: InvitationChannelKey;
  onClose: () => void;
}) {
  const { data: history, isLoading } = useAdminChannelPoolTopupHistory(channel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <Card className="relative w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-[var(--brand-navy)]">Topup history</h2>

        <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
          {isLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </>
          ) : history && history.length > 0 ? (
            history.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--brand-navy)]">
                    +{entry.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(entry.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                {entry.note && <p className="mt-1 text-sm text-slate-500">{entry.note}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  By {entry.topped_up_by_name ?? "Unknown"}
                </p>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">No topups recorded yet.</p>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PoolCard({
  pool,
  onTopup,
  onHistory,
}: {
  pool: PlatformChannelPool;
  onTopup: () => void;
  onHistory: () => void;
}) {
  const pct = pool.total_capacity > 0 ? Math.min((pool.used / pool.total_capacity) * 100, 100) : 0;
  const barColor = pool.is_exhausted ? "#dc2626" : pool.is_low ? "#d97706" : "#0f766e";

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[var(--brand-navy)]">{pool.channel_display}</h3>
        {pool.is_exhausted ? (
          <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Exhausted
          </span>
        ) : pool.is_low ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Low
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            Healthy
          </span>
        )}
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <p className="font-bold text-[var(--brand-navy)]">{pool.total_capacity.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Capacity</p>
        </div>
        <div>
          <p className="font-bold text-[var(--brand-navy)]">{pool.used.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Used</p>
        </div>
        <div>
          <p className="font-bold text-[var(--brand-navy)]">{pool.remaining.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Remaining</p>
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-slate-400">
        Low-balance threshold: {pool.low_balance_threshold.toLocaleString()}
      </p>

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
        <Button variant="outline" size="sm" className="flex-1" onClick={onHistory}>
          <History className="h-3.5 w-3.5" />
          History
        </Button>
        <Button size="sm" className="flex-1" onClick={onTopup}>
          <PlusCircle className="h-3.5 w-3.5" />
          Top up
        </Button>
      </div>
    </Card>
  );
}

export default function ChannelPools() {
  const { data: pools, isLoading, isError } = useAdminChannelPools();
  const [topupChannel, setTopupChannel] = useState<InvitationChannelKey | null>(null);
  const [historyChannel, setHistoryChannel] = useState<InvitationChannelKey | null>(null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--brand-navy)]">Platform Channel Pools</h1>
        <p className="mt-1 text-sm text-slate-500">
          Every send on a channel, regardless of organizer or plan, is checked against and
          deducted from that channel's platform-wide pool here. An exhausted pool hard-blocks
          that channel for everyone until it's topped up.
        </p>
      </div>

      {isError ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          We couldn't load channel pools right now. Please refresh the page.
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-3xl" />
          ))}
        </div>
      ) : pools && pools.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pools.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onTopup={() => setTopupChannel(pool.channel)}
              onHistory={() => setHistoryChannel(pool.channel)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-slate-500">No channel pools found.</Card>
      )}

      {topupChannel && (
        <TopupFormDialog defaultChannel={topupChannel} onClose={() => setTopupChannel(null)} />
      )}

      {historyChannel && (
        <HistoryDialog channel={historyChannel} onClose={() => setHistoryChannel(null)} />
      )}
    </div>
  );
}