export type InvitationStatus = "NOT_SENT" | "SENT" | "FAILED";
export type ResponseStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "MAYBE";

export type GuestChannel = "WHATSAPP" | "EMAIL" | "SMS" | "VOICE_CALL";
export type ChannelDeliveryStatus = "LINK_GENERATED" | "SENT" | "FAILED" | "CALLING";

// Phase 15
export interface GuestCategory {
  id: number;
  name: string;
  display_order: number;
  guest_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGuestCategoryPayload {
  name: string;
  display_order?: number;
}

export type UpdateGuestCategoryPayload = Partial<CreateGuestCategoryPayload>;

export interface Guest {
  id: number;
  category: number | null;
  category_name: string | null;
  name: string;
  mobile_number: string;
  email: string;
  family_member_count: number;
  invitation_status: InvitationStatus;
  /** Per-channel delivery state, e.g. { EMAIL: "SENT", WHATSAPP: "SENT" }.
   *  A channel that was never tried is simply absent. */
  channel_status?: Partial<Record<GuestChannel, ChannelDeliveryStatus>>;
  response_status: ResponseStatus;
  responded_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

// The backend doesn't slim this down for the list endpoint (unlike Events),
// so it's the same shape - kept as a distinct alias for call-site clarity.
export type GuestListItem = Guest;

export interface CreateGuestPayload {
  name: string;
  mobile_number: string;
  email?: string;
  family_member_count?: number;
  notes?: string;
  category?: number | null;
}

export type UpdateGuestPayload = Partial<CreateGuestPayload>;

export interface CSVImportSkippedRow {
  row: number;
  reason: string;
}

export interface CSVImportResult {
  created_count: number;
  skipped_count: number;
  skipped_rows: CSVImportSkippedRow[];
}

// --------------------------------------------------
// Contact Import (Phase 16)
// --------------------------------------------------

/** One editable row in the Contact Import review table, before submission. */
export interface ContactImportRow {
  /** Client-side only id for React keys / row removal - never sent to the backend. */
  localId: string;
  name: string;
  mobile_number: string;
  email: string;
  category: number | null;
  family_member_count: number;
}

export interface ContactImportPayload {
  guests: Array<{
    name: string;
    mobile_number: string;
    email?: string;
    category?: number | null;
    family_member_count?: number;
  }>;
}

export interface ContactImportResult {
  created_count: number;
  skipped_count: number;
  skipped_rows: Array<{ row: number; reason: string }>;
}

// --------------------------------------------------
// Reminders (Phase 22)
// --------------------------------------------------

export interface ReminderSchedule {
  id: number;
  category: number | null;
  category_name: string | null;
  guest: number | null;
  guest_name: string | null;
  delay_hours: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateReminderSchedulePayload {
  delay_hours: number;
  category?: number | null;
  guest?: number | null;
}

export interface PendingWhatsAppReminder {
  id: number;
  guest: number;
  guest_name: string;
  guest_mobile_number: string;
  due_at: string;
  created_at: string;
}