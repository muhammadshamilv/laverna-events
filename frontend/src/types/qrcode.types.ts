// Field names here must match qr_codes/serializers.py exactly.

import type { GalleryMedia } from "./gallery.types";

export interface EventQRCode {
  token: string;
  scan_url: string;
  is_active: boolean;
  png_download_url: string;
  pdf_download_url: string;
}

/** Public, guest-facing - what /scan/:token loads before the selfie step.
 * Deliberately smaller than the organizer's Event type (see
 * qr_codes/serializers.py's ScannedEventSerializer docstring). */
export interface ScannedEvent {
  id: number;
  name: string;
  event_date: string;
  cover_image: string | null;
}

export interface SelfieMatchResult {
  match_count: number;
  matched_media: GalleryMedia[];
}