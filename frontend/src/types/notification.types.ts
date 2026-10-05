export type NotificationChannel = "WHATSAPP" | "EMAIL" | "SMS" | "VOICE_CALL";
export type NotificationStatus = "LINK_GENERATED" | "SENT" | "FAILED" | "CALLING";

export interface NotificationLog {
  id: number;
  guest: number;
  guest_name: string;
  template_name: string;
  channel: NotificationChannel;
  wa_link: string;
  call_sid: string;
  status: NotificationStatus;
  failure_reason: string;
  retry_count: number;
  created_at: string;
}

/**
 * The organizer picks the channel on the Guests page at send time.
 * `channel` is optional only for reminders, where the backend falls back
 * to the channel the guest's invitation last went out on.
 */
export interface SendActiveTemplatePayload {
  guest_id: number;
  channel?: NotificationChannel;
}

// --------------------------------------------------
// Bulk send (Email / SMS / Voice Call)
// --------------------------------------------------

/** Which guests a bulk send targets. Any combination may be given. */
export interface BulkSendSelection {
  guest_ids?: number[];
  category_ids?: number[];
  include_uncategorized?: boolean;
  select_all?: boolean;
}

export interface BulkSendPayload extends BulkSendSelection {
  channel: NotificationChannel;
  skip_already_sent?: boolean;
  /** Cursor: only guests with an id greater than this are processed. */
  after_id?: number;
  batch_size?: number;
}

export type BulkSendOutcome = "sent" | "failed" | "skipped";

export interface BulkSendResultItem {
  guest_id: number;
  guest_name: string;
  outcome: BulkSendOutcome;
  message: string;
}

/** The result of ONE batch; the frontend loops until has_more is false. */
export interface BulkSendBatchResult {
  channel: NotificationChannel;
  total_matching: number;
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  results: BulkSendResultItem[];
  has_more: boolean;
  next_after_id: number | null;
  stopped: boolean;
  stopped_reason: string;
  not_attempted: number;
}