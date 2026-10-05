import { Link, useParams } from "react-router-dom";
import { useEvent } from "@/queries/useEventQueries";
import EventForm from "@/components/events/EventForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? Number(id) : undefined;

  const { data: event, isLoading, isError } = useEvent(eventId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <Card className="p-8">
          <Skeleton className="h-6 w-48" />
          <div className="mt-6 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Card className="p-8">
          <p className="text-sm text-slate-500">
            This event couldn't be found, or you don't have access to it.
          </p>
          <Link to="/portal/events" className={buttonVariants({ variant: "outline", className: "mt-6" })}>
            Back to events
          </Link>
        </Card>
      </div>
    );
  }

  return <EventForm existingEvent={event} />;
}