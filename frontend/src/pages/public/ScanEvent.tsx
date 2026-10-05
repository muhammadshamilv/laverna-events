import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Download, ImageOff, RotateCcw } from "lucide-react";
import logo from "@/assets/laverna-logo.png";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useScannedEvent, useSelfieMatchMutation } from "@/queries/useQRCodeQueries";
import { resolveMediaUrl } from "@/lib/media";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatEventDate } from "@/lib/eventDisplay";
import type { GalleryMedia } from "@/types/gallery.types";

type Step = "intro" | "matching" | "results";

/**
 * Public, guest-facing "scan QR -> selfie -> matched photos" page. No
 * login, no PublicLayout/PortalLayout shell (see App.tsx's route entry
 * for why) - this is a completely standalone full-screen page, matching
 * how RespondToInvitation.tsx (the other token-based public page) is
 * built, since a guest arriving here has no account and no navigation
 * context from the rest of the app.
 *
 * capture="user" on the file input opens the phone's native camera app
 * already flipped to the front/selfie camera - no getUserMedia/permission
 * handling needed in-page, and it degrades gracefully to a plain file
 * picker on desktop browsers that don't support `capture`.
 */
export default function ScanEvent() {
  const { token } = useParams<{ token: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: event, isLoading: eventLoading, isError: eventError } = useScannedEvent(token);
  const selfieMutation = useSelfieMatchMutation(token ?? "");

  const [step, setStep] = useState<Step>("intro");
  const [matchedMedia, setMatchedMedia] = useState<GalleryMedia[]>([]);
  const [selfieError, setSelfieError] = useState<string | null>(null);

  const handleFileChange = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || !token) return;

    setSelfieError(null);
    setStep("matching");

    selfieMutation.mutate(file, {
      onSuccess: (result) => {
        setMatchedMedia(result.matched_media);
        setStep("results");
      },
      onError: (error) => {
        setSelfieError(getApiErrorMessage(error, "Couldn't process that selfie. Please try again."));
        setStep("intro");
      },
    });
  };

  const handleRetake = () => {
    setSelfieError(null);
    setMatchedMedia([]);
    setStep("intro");
  };

  const handleDownload = (media: GalleryMedia) => {
    const url = resolveMediaUrl(media.file);
    if (!url) return;

    const link = document.createElement("a");
    link.href = url;
    link.download = `photo-${media.id}.jpg`;
    link.target = "_blank";
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (eventLoading) {
    return (
      <div className="gradient-mesh-subtle flex min-h-screen items-center justify-center px-5">
        <div className="w-full max-w-sm space-y-3 text-center">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="mx-auto h-4 w-40" />
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="gradient-mesh-subtle flex min-h-screen items-center justify-center px-5 text-center">
        <div>
          <ImageOff className="mx-auto h-10 w-10 text-slate-300" />
          <h1 className="mt-4 text-lg font-bold text-[var(--brand-navy)]">
            This QR code isn't active
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            It may have been deactivated by the event organizer, or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  const coverUrl = resolveMediaUrl(event.cover_image);

  return (
    <div className="gradient-mesh-subtle mobile-safe-bottom min-h-screen px-5 pb-10 pt-8">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <img src={logo} alt="LavernaEvents" className="h-9 w-auto object-contain" />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 w-full"
        >
          {coverUrl && (
            <div className="mb-5 h-40 w-full overflow-hidden rounded-2xl">
              <img src={coverUrl} alt={event.name} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="text-center">
            <h1 className="text-xl font-bold text-[var(--brand-navy)]">{event.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{formatEventDate(event.event_date)}</p>
          </div>

          {step === "intro" && (
            <div className="mt-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-pink)]/10">
                <Camera className="h-7 w-7 text-[var(--brand-pink)]" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-[var(--brand-navy)]">
                Find your photos
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Take a quick selfie and we'll find every photo from this event you appear in.
              </p>

              {selfieError && <p className="mt-4 text-sm text-rose-600">{selfieError}</p>}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(event) => handleFileChange(event.target.files)}
              />
              <Button
                type="button"
                size="lg"
                className="mt-6 w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Take a selfie
              </Button>

              <p className="mt-4 text-xs text-slate-400">
                Your selfie is only used to find matching photos and is never stored.
              </p>
            </div>
          )}

          {step === "matching" && (
            <div className="mt-10 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-pink)] border-t-transparent" />
              <p className="mt-4 text-sm text-slate-500">Finding your photos...</p>
            </div>
          )}

          {step === "results" && (
            <div className="mt-8">
              {matchedMedia.length === 0 ? (
                <div className="text-center">
                  <ImageOff className="mx-auto h-10 w-10 text-slate-300" />
                  <h2 className="mt-4 text-lg font-semibold text-[var(--brand-navy)]">
                    No matching photos yet
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Check back later as more photos are uploaded, or try again with a clearer selfie.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-center text-sm font-medium text-slate-600">
                    We found {matchedMedia.length}{" "}
                    {matchedMedia.length === 1 ? "photo" : "photos"} of you
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {matchedMedia.map((media) => {
                      const mediaUrl = resolveMediaUrl(media.file);
                      return (
                        <div
                          key={media.id}
                          className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100"
                        >
                          {mediaUrl && (
                            <img
                              src={mediaUrl}
                              alt={media.caption || "Matched photo"}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleDownload(media)}
                            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--brand-navy)] shadow-md"
                            aria-label="Download photo"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <Button
                type="button"
                variant="outline"
                className="mt-6 w-full"
                onClick={handleRetake}
              >
                <RotateCcw className="h-4 w-4" />
                Take another selfie
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}