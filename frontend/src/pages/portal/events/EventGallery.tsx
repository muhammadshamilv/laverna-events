import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Star,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useEvent } from "@/queries/useEventQueries";
import {
  useEventGallery,
  useDeleteGalleryMediaMutation,
  useToggleGalleryMediaFeaturedMutation,
  useUploadGalleryMediaMutation,
} from "@/queries/useGalleryQueries";
import {
  useEventPhotographerAccess,
  useGrantPhotographerAccessMutation,
  useRevokePhotographerAccessMutation,
} from "@/queries/usePhotographerQueries";
import { resolveMediaUrl } from "@/lib/media";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";

export default function EventGallery() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? Number(id) : undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: media, isLoading: mediaLoading } = useEventGallery(eventId);
  const { data: grants, isLoading: grantsLoading } = useEventPhotographerAccess(eventId);

  const uploadMutation = useUploadGalleryMediaMutation(eventId);
  const deleteMutation = useDeleteGalleryMediaMutation(eventId);
  const featureMutation = useToggleGalleryMediaFeaturedMutation(eventId);
  const grantMutation = useGrantPhotographerAccessMutation(eventId);
  const revokeMutation = useRevokePhotographerAccessMutation(eventId);

  const [grantOpen, setGrantOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [grantError, setGrantError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

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

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    setGrantError(null);

    grantMutation.mutate(
      { mobile_number: mobileNumber.trim() },
      {
        onSuccess: () => {
          setMobileNumber("");
          setGrantOpen(false);
        },
        onError: (err) => {
          setGrantError(getApiErrorMessage(err, "Couldn't grant access."));
        },
      }
    );
  };

  if (eventLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-7 w-56" />
      </div>
    );
  }

  if (!event || !eventId) {
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
    <div className="mobile-safe-bottom px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to={`/portal/events/${eventId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[var(--brand-navy)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to event
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[var(--brand-navy)] sm:text-2xl">
                Gallery
              </h1>
              <p className="mt-1 text-sm text-slate-500">{event.name}</p>
            </div>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGrantOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Invite photographer</span>
              </Button>
              <Button
                size="sm"
                isLoading={uploadMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
            </div>
          </div>

          {uploadError && (
            <p className="mt-3 text-sm text-rose-600" role="alert">
              {uploadError}
            </p>
          )}

          {/* Photographer access grants */}
          {!grantsLoading && grants && grants.length > 0 && (
            <Card className="mt-5 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--brand-navy)]" />
                <p className="text-sm font-semibold text-[var(--brand-navy)]">
                  Photographers with access
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {grants.map((grant) => (
                  <div
                    key={grant.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--brand-navy)]">
                        {grant.photographer.full_name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {grant.photographer.mobile_number}
                      </p>
                    </div>
                    {grant.is_currently_valid ? (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={
                          revokeMutation.isPending &&
                          revokeMutation.variables === grant.id
                        }
                        onClick={() => revokeMutation.mutate(grant.id)}
                        className="border-rose-200 text-rose-600 hover:bg-rose-50"
                      >
                        Revoke
                      </Button>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        Revoked
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Media grid */}
          <div className="mt-6">
            {mediaLoading && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map((n) => (
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
                  No photos or videos yet. Upload some, or invite a photographer to
                  contribute.
                </p>
              </Card>
            )}

            {!mediaLoading && media && media.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {media.map((item) => {
                  const fileUrl = resolveMediaUrl(item.file);
                  const thumbUrl = resolveMediaUrl(item.thumbnail);

                  return (
                    <div
                      key={item.id}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100"
                    >
                      {item.media_type === "IMAGE" ? (
                        <img
                          src={fileUrl ?? ""}
                          alt={item.caption || "Gallery item"}
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

                      {item.is_featured && (
                        <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand-gold)] text-white">
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </span>
                      )}

                      <div className="absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-black/50 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => featureMutation.mutate(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:bg-white"
                          aria-label="Toggle featured"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              item.is_featured && "fill-[var(--brand-gold)] text-[var(--brand-gold)]"
                            )}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 hover:bg-white"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Invite photographer sheet/modal */}
      {grantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setGrantOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 soft-shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--brand-navy)]">
                Invite photographer
              </h2>
              <button
                type="button"
                onClick={() => setGrantOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Enter the mobile number of a registered photographer account to grant
              them access to this event's gallery.
            </p>

            <form onSubmit={handleGrant} className="mt-4">
              <label className="text-xs font-semibold text-slate-500">
                Photographer's mobile number
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="9876543210"
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-[var(--brand-pink)]"
              />

              {grantError && (
                <p className="mt-2 text-sm text-rose-600" role="alert">
                  {grantError}
                </p>
              )}

              <Button
                type="submit"
                isLoading={grantMutation.isPending}
                className="mt-4 w-full"
              >
                Grant access
              </Button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this media?"
        description="This photo or video will be permanently removed from the gallery."
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget !== null) {
            deleteMutation.mutate(deleteTarget, {
              onSettled: () => setDeleteTarget(null),
            });
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}