import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, ImagePlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyPhotographerEvents } from "@/queries/usePhotographerQueries";
import { useEventGallery, useUploadGalleryMediaMutation } from "@/queries/useGalleryQueries";
import { formatEventDate, formatEventTime } from "@/lib/eventDisplay";
import { resolveMediaUrl } from "@/lib/media";
import { getApiErrorMessage } from "@/lib/apiError";

export default function PhotographerEventUpload() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? Number(id) : undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reuses the same "my granted events" list to get this event's display
  // details (name/date/venue) rather than fetching the full organizer
  // Event object, which this account has no permission to read directly -
  // a photographer's access is scoped to the gallery endpoint only, not
  // GET /events/:id/.
  const { data: grants, isLoading: grantsLoading } = useMyPhotographerEvents();
  const grant = grants?.find((g) => g.event.id === eventId);

  const { data: media, isLoading: mediaLoading } = useEventGallery(eventId);
  const uploadMutation = useUploadGalleryMediaMutation(eventId);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    Array.from(files).forEach((file) => {
      uploadMutation.mutate(
        { file },
        {
          onError: (err) => {
            setUploadError(getApiErrorMessage(err, `Couldn't upload ${file.name}.`));
          },
        }
      );
    });
  };

  if (grantsLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-7 w-56" />
      </div>
    );
  }

  if (!grant || !eventId) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Card className="p-8">
          <p className="text-sm text-slate-500">
            You don't have access to this event, or it doesn't exist.
          </p>
          <Link
            to="/photographer"
            className={buttonVariants({ variant: "outline", className: "mt-6" })}
          >
            Back to my events
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mobile-safe-bottom px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/photographer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[var(--brand-navy)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my events
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4"
        >
          <h1 className="text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">
            {grant.event.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatEventDate(grant.event.event_date)} · {formatEventTime(grant.event.event_time)}
          </p>

          {!grant.is_currently_valid && (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              Your access to this event has been revoked or has expired. You can
              still view what you've uploaded, but new uploads are disabled.
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--brand-navy)]">
              {media?.length ?? 0} uploaded
            </p>

            {grant.is_currently_valid && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <Button
                  size="sm"
                  isLoading={uploadMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  Upload
                </Button>
              </>
            )}
          </div>

          {uploadError && (
            <p className="mt-3 text-sm text-rose-600" role="alert">
              {uploadError}
            </p>
          )}

          <div className="mt-4">
            {mediaLoading && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="aspect-square w-full rounded-2xl" />
                ))}
              </div>
            )}

            {!mediaLoading && (!media || media.length === 0) && (
              <Card className="p-10 text-center">
                <span
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "var(--gradient-brand-soft)" }}
                >
                  <Camera className="h-5 w-5 text-[var(--brand-navy)]" />
                </span>
                <p className="mt-3 text-sm text-slate-500">
                  Nothing uploaded yet. Tap Upload to add your first photos or videos.
                </p>
              </Card>
            )}

            {!mediaLoading && media && media.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.map((item) => {
                  const fileUrl = resolveMediaUrl(item.file);
                  const thumbUrl = resolveMediaUrl(item.thumbnail);

                  return (
                    <div
                      key={item.id}
                      className="aspect-square overflow-hidden rounded-2xl bg-slate-100"
                    >
                      {item.media_type === "IMAGE" ? (
                        <img
                          src={fileUrl ?? ""}
                          alt={item.caption || "Uploaded item"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={fileUrl ?? ""}
                          poster={thumbUrl ?? undefined}
                          className="h-full w-full object-cover"
                          muted
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
