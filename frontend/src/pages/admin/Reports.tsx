import { CalendarDays, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminReports } from "@/queries/useAdminQueries";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStorage(mb: number | null | undefined): string {
  const safeMb = mb ?? 0;
  if (safeMb >= 1024) return `${(safeMb / 1024).toFixed(1)} GB`;
  return `${safeMb.toFixed(0)} MB`;
}

function formatShortDate(periodStr: string): string {
  return new Date(periodStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Lightweight bar chart built from plain divs - no new chart library
// dependency needed for a simple 30-day trend. Bars are scaled relative to
// the max value in the series; an all-zero or empty series renders flat
// empty bars rather than dividing by zero.
function BarChart({
  data,
  valueKey,
  color,
}: {
  data: Array<Record<string, any>>;
  valueKey: string;
  color: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        No data for this period yet.
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d[valueKey] ?? 0), 1);

  return (
    <div className="flex h-40 items-end gap-1">
      {data.map((point, i) => (
        <div key={i} className="group relative flex-1">
          <div
            className="w-full rounded-t-sm transition-opacity hover:opacity-80"
            style={{
              height: `${Math.max(((point[valueKey] ?? 0) / max) * 100, 2)}%`,
              backgroundColor: color,
            }}
          />
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--brand-navy)] px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
            {formatShortDate(point.period)}: {point[valueKey]}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const { data: reports, isLoading, isError } = useAdminReports();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--brand-navy)]">Reports</h1>
        <p className="mt-1 text-sm text-slate-500">
          Revenue, registrations, and platform usage trends.
        </p>
      </div>

      {isError ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          We couldn't load reports right now. Please refresh the page.
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      ) : reports ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f766e]/10 text-[#0f766e]">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Active Events</p>
                  <p className="text-xl font-bold text-[var(--brand-navy)]">
                    {reports.active_events_count ?? 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7c3aed]/10 text-[#7c3aed]">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Storage Usage</p>
                  <p className="text-xl font-bold text-[var(--brand-navy)]">
                    {formatStorage(reports.storage_usage_mb)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="font-bold text-[var(--brand-navy)]">Revenue (last 30 days)</h2>
            <p className="mt-1 text-sm text-slate-500">
              Total:{" "}
              {formatCurrency(
                (reports.revenue_by_period ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)
              )}
            </p>
            <div className="mt-4">
              <BarChart data={reports.revenue_by_period ?? []} valueKey="amount" color="#d41472" />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-bold text-[var(--brand-navy)]">Registrations (last 30 days)</h2>
            <p className="mt-1 text-sm text-slate-500">
              Total:{" "}
              {(reports.registrations_by_period ?? []).reduce((sum, p) => sum + (p.count ?? 0), 0)}
            </p>
            <div className="mt-4">
              <BarChart
                data={reports.registrations_by_period ?? []}
                valueKey="count"
                color="#241542"
              />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-bold text-[var(--brand-navy)]">Membership Statistics</h2>
            </div>
            {reports.membership_statistics && reports.membership_statistics.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium text-right">Active Subscribers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reports.membership_statistics.map((stat) => (
                    <tr key={stat.plan_name}>
                      <td className="px-5 py-3 font-medium text-[var(--brand-navy)]">
                        {stat.plan_name}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500">
                        {stat.active_subscribers}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5 text-center text-sm text-slate-500">No subscription data yet.</div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}