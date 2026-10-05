import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEvent } from "@/queries/useEventQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import GuestImportExport from "@/components/guests/GuestImportExport";
import GuestCardList from "@/components/guests/GuestCardList";

export default function EventGuests() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? Number(id) : undefined;

  const { data: event, isLoading, isError } = useEvent(eventId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-7 w-56" />
      </div>
    );
  }

  if (isError || !event || !eventId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Card className="p-8">
          <p className="text-sm text-slate-500">
            This event couldn't be found, or you don't have access to it.
          </p>
          <Link
            to="/portal/events"
            className={buttonVariants({ variant: "outline", className: "mt-6" })}
          >
            Back to events
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 pt-6 sm:px-6 sm:pt-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Link
            to={`/portal/events/${eventId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[var(--brand-navy)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {event.name}
          </Link>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg font-semibold text-[var(--brand-navy)]">Guest management</h1>
            <GuestImportExport eventId={eventId} />
          </div>
        </div>
      </div>

      <GuestCardList eventId={eventId} />
    </div>
  );
}