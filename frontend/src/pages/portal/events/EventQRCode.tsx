import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, FileText, QrCode as QrCodeIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvent } from "@/queries/useEventQueries";
import { useDownloadEventQRCodeMutation, useEventQRCode } from "@/queries/useQRCodeQueries";
import { getApiErrorMessage } from "@/lib/apiError";

/**
 * Organizer's QR code management page for one event. The on-screen
 * preview is the SAME backend-generated PNG used for the "Download PNG"
 * button (fetched once as a blob via the download mutation and shown in
 * an <img>), rather than a separately client-rendered QR code - this
 * guarantees the preview is pixel-identical to what actually gets
 * downloaded/printed, and avoids adding a new QR-rendering npm package
 * just for a preview.
 */
export default function EventQRCode() {
  const { id } = useParams<{ id: string }>();
  const eventId = id ? Number(id) : undefined;

  const { data: event, isLoading: eventLoading } = useEvent(eventId);
  const { data: qrCode, isLoading: qrLoading, isError } = useEventQRCode(eventId);
  const downloadMutation = useDownloadEventQRCodeMutation();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<"png" | "pdf" | null>(null);

  // Fetch the PNG once (as an object URL) purely to display it as the
  // preview image. Revoked on unmount/re-fetch to avoid leaking blob
  // URLs as the organizer navigates between events' QR pages.
  useEffect(() => {
    if (!eventId || !qrCode) return;

    let objectUrl: string | null = null;
    let cancelled = false;

    downloadMutation.mutate(
      { eventId, format: "png" },
      {
        onSuccess: (blob) => {
          if (cancelled) return;
          objectUrl = window.URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
        },
        onError: (error) => {
          if (cancelled) return;
          setPreviewError(getApiErrorMessage(error, "Couldn't load the QR code preview."));
        },
      }
    );

    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, qrCode]);

  const handleDownload = (format: "png" | "pdf") => {
    if (!eventId || !event) return;

    setDownloadError(null);
    setDownloadingFormat(format);

    downloadMutation.mutate(
      { eventId, format },
      {
        onSuccess: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `event-${eventId}-qr-code.${format}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
          setDownloadingFormat(null);
        },
        onError: (error) => {
          setDownloadError(getApiErrorMessage(error, `Couldn't download the ${format.toUpperCase()}.`));
          setDownloadingFormat(null);
        },
      }
    );
  };

  const isLoading = eventLoading || qrLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
        <Skeleton className="h-4 w-32" />
        <Card className="mt-6 p-8">
          <Skeleton className="mx-auto h-56 w-56" />
        </Card>
      </div>
    );
  }

  if (isError || !event || !qrCode) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Card className="p-8">
          <p className="text-sm text-slate-500">
            This event's QR code couldn't be loaded, or you don't have access to it.
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
      <div className="mx-auto max-w-2xl">
        <Link
          to={`/portal/events/${event.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[var(--brand-navy)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to event
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="mt-4 p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-navy)]/10 text-[var(--brand-navy)]">
                <QrCodeIcon className="h-5 w-5" />
              </span>
              <div>
                <h1 className="font-semibold text-[var(--brand-navy)]">QR Code</h1>
                <p className="text-sm text-slate-500">{event.name}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center rounded-2xl bg-white p-6">
              <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-slate-100 bg-white p-4">
                {previewUrl ? (
                  <img src={previewUrl} alt="Event QR code" className="h-full w-full object-contain" />
                ) : previewError ? (
                  <p className="text-center text-xs text-rose-600">{previewError}</p>
                ) : (
                  <Skeleton className="h-full w-full" />
                )}
              </div>
            </div>

            <p className="mt-5 text-center text-sm text-slate-500">
              Guests scan this code to open the event's gallery, take a selfie, and download
              every photo they appear in.
            </p>

            {downloadError && (
              <p className="mt-4 text-center text-sm text-rose-600">{downloadError}</p>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDownload("png")}
                isLoading={downloadingFormat === "png"}
                disabled={downloadingFormat !== null}
              >
                <Download className="h-4 w-4" />
                Download PNG
              </Button>
              <Button
                type="button"
                onClick={() => handleDownload("pdf")}
                isLoading={downloadingFormat === "pdf"}
                disabled={downloadingFormat !== null}
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </Button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Print the PDF and place it at your venue for guests to scan.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}