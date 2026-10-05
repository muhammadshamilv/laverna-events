import { useMutation, useQuery } from "@tanstack/react-query";
import {
  downloadEventQRCodeFile,
  getEventQRCode,
  getScannedEvent,
  matchSelfie,
} from "@/api/qrcode.api";

export const qrCodeKeys = {
  event: (eventId: number) => ["qr-code", "event", eventId] as const,
  scanned: (token: string) => ["qr-code", "scanned", token] as const,
};

export function useEventQRCode(eventId?: number) {
  return useQuery({
    queryKey: qrCodeKeys.event(eventId ?? 0),
    queryFn: () => getEventQRCode(eventId as number),
    enabled: typeof eventId === "number",
  });
}

export function useDownloadEventQRCodeMutation() {
  return useMutation({
    mutationFn: ({ eventId, format }: { eventId: number; format: "png" | "pdf" }) =>
      downloadEventQRCodeFile(eventId, format),
  });
}

/** Public, guest-facing: loads the event info for the /scan/:token
 * landing page. No `enabled` gate on a truthy user needed here (unlike
 * the organizer queries above) since this route has no auth at all -
 * `token` coming from the URL param is the only precondition. */
export function useScannedEvent(token?: string) {
  return useQuery({
    queryKey: qrCodeKeys.scanned(token ?? ""),
    queryFn: () => getScannedEvent(token as string),
    enabled: Boolean(token),
    retry: false,
  });
}

export function useSelfieMatchMutation(token: string) {
  return useMutation({
    mutationFn: (selfie: File) => matchSelfie(token, selfie),
  });
}