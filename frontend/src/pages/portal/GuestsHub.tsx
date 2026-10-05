import { Link } from "react-router-dom";
import { CalendarPlus, ChevronRight, Image as ImageIcon, Users } from "lucide-react";
import { useEvents } from "@/queries/useEventQueries";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { eventTypeLabel, formatEventDate } from "@/lib/eventDisplay";
import { resolveMediaUrl } from "@/lib/media";

// A launcher, not a duplicate guest list: guests are always scoped to a
// specific event on the backend (there's no cross-event guest endpoint),
// so this page's only job is "pick which event's guests you want to
// manage" and hand off to that event's real guest page.
export default function GuestsHub() {
  const { data, isLoading, isError } = useEvents(1);
  const events = data?.events ?? [];

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-pink)]">
          Guests
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--brand-navy)] sm:text-3xl">
          Select an event to manage its guests
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Every guest list belongs to a specific event - pick one below.
        </p>

        {isError && (
          <p className="mt-10 text-center text-sm text-rose-600">
            Couldn't load your events right now. Please refresh the page.
          </p>
        )}

        {isLoading && (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="flex items-center gap-3 p-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <Card className="mt-8 p-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-pink)]/10 text-[var(--brand-pink)]">
              <CalendarPlus className="h-6 w-6" />
            </span>
            <p className="mt-4 font-semibold text-[var(--brand-navy)]">No events yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create an event first, then you can add and manage its guests.
            </p>
            <Link
              to="/portal/events/new"
              className={buttonVariants({ variant: "primary", className: "mt-6" })}
            >
              Create an event
            </Link>
          </Card>
        )}

        {!isLoading && !isError && events.length > 0 && (
          <div className="mt-6 space-y-3">
            {events.map((event) => {
              const coverUrl = resolveMediaUrl(event.cover_image);

              return (
                <Link key={event.id} to={`/portal/events/${event.id}/guests`}>
                  <Card className="card-hover-lift flex items-center gap-3 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {coverUrl ? (
                        <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[var(--brand-navy)]">
                        {event.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {eventTypeLabel(event.event_type)} · {formatEventDate(event.event_date)}
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 shrink-0 text-sm font-medium text-[var(--brand-pink)]">
                      <Users className="h-4 w-4" />
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
