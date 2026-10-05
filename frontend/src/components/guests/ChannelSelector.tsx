import { CHANNELS } from "@/lib/channels";
import { cn } from "@/lib/utils";
import type { NotificationChannel } from "@/types/notification.types";

interface ChannelSelectorProps {
  value: NotificationChannel | null;
  onChange: (channel: NotificationChannel) => void;
}

/**
 * Step 1 on the Guests page: choose HOW to send before touching any guest.
 */
export default function ChannelSelector({ value, onChange }: ChannelSelectorProps) {
  const selected = CHANNELS.find((channel) => channel.key === value) ?? null;

  return (
    <div className="premium-card p-4 lg:p-5">
      <p className="text-sm font-semibold text-[var(--brand-navy)]">Send invitations via</p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CHANNELS.map((channel) => {
          const isSelected = channel.key === value;
          const Icon = channel.icon;

          return (
            <button
              key={channel.key}
              type="button"
              onClick={() => onChange(channel.key)}
              aria-pressed={isSelected}
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors",
                isSelected
                  ? "border-[var(--brand-pink)] bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {channel.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {selected
          ? selected.description
          : "Choose a channel to start sending. You can switch any time."}
      </p>
    </div>
  );
}