export type InvitationChannel = "WHATSAPP" | "EMAIL" | "SMS" | "VOICE_CALL";

export interface TemplateCustomField {
  id: number;
  field_key: string;
  label: string;
  display_order: number;
}

export interface InvitationTemplate {
  id: number;
  name: string;
  description: string;
  channel: InvitationChannel;
  preview_image: string | null;
  body_text: string;
  placeholder_fields: string[];
  custom_fields: TemplateCustomField[];
  is_custom: boolean;
  display_order: number;
  in_library: boolean;
}

export type InvitationStatus = "GENERATED" | "FAILED";

export interface Invitation {
  id: number;
  guest: number;
  guest_name: string;
  template: number;
  template_name: string;
  response_token: string;
  image_file: string | null;
  pdf_file: string | null;
  rendered_text: string;
  status: InvitationStatus;
  created_at: string;
}

export interface InvitationPreviewRequest {
  guest_id: number;
  template_id: number;
}

export interface InvitationPreviewResult {
  channel: InvitationChannel;
  rendered_text: string;
  has_image: boolean;
}

// --------------------------------------------------
// Custom Template Upload (Phase 19), extended with
// custom field definitions (Phase 20)
// --------------------------------------------------

export interface CustomFieldDefinitionInput {
  field_key: string;
  label: string;
}

export interface CustomTemplateUploadPayload {
  name: string;
  description?: string;
  channel: InvitationChannel;
  body_text?: string;
  custom_fields?: CustomFieldDefinitionInput[];
  preview_image?: File | null;
  background_image?: File | null;
}

export interface CustomTemplate {
  id: number;
  name: string;
  description: string;
  channel: InvitationChannel;
  preview_image: string | null;
  background_image: string | null;
  body_text: string;
  placeholder_fields: string[];
  custom_fields: TemplateCustomField[];
  is_custom: boolean;
  is_active: boolean;
  created_at: string;
  in_library: boolean;
}

// --------------------------------------------------
// Active Filled Template (Phase 20)
// --------------------------------------------------
//
// The organizer's ONE globally-active filled template. Selecting and
// filling happens entirely on the Templates page. The channel is NOT part
// of it any more: the organizer picks WhatsApp / Email / SMS / Voice Call
// on the Guests page at send time.

export const STANDARD_FIELD_LABELS: Record<string, string> = {
  event_name: "Event name",
  event_date: "Event date",
  event_time: "Event time",
  venue_name: "Venue name",
  venue_address: "Venue address",
  host_name: "Host name",
};

export interface EventStandardDefaults {
  event_name: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  host_name: string;
}

export interface FillActiveTemplatePayload {
  template_id: number;
  event_id: number;
  standard_values: Record<string, string>;
  custom_values: Record<string, string>;
}

export interface ActiveFilledTemplate {
  id: number;
  template: number;
  template_name: string;
  template_channel: InvitationChannel;
  template_preview_image: string | null;
  event: number;
  event_name: string;
  standard_values: Record<string, string>;
  custom_values: Record<string, string>;
  rendered_preview_text: string;
  created_at: string;
  updated_at: string;
}

/**
 * The confirmed template as guests will receive it: the organizer's text
 * drawn on the card (`image` is a data URL, null when the template has no
 * background image) plus the message text, if the template has any.
 */
export interface ActiveTemplatePreview {
  template_id: number;
  template_name: string;
  has_image: boolean;
  image: string | null;
  text: string;
}

// --------------------------------------------------
// Invitation Report (Phase 24)
// --------------------------------------------------

export type GuestResponseStatusKey = "PENDING" | "ACCEPTED" | "REJECTED" | "MAYBE";

export interface ChannelSendTotals {
  sent: number;
  failed: number;
  reminders_sent: number;
}

export type SendSummary = Record<InvitationChannel, ChannelSendTotals>;

export interface ResponseStatusTotals {
  guests: number;
  headcount: number;
}

export type RsvpSummary = Record<GuestResponseStatusKey, ResponseStatusTotals>;

export interface CategoryReportBreakdown {
  category_id: number | null;
  category_name: string;
  send_summary: SendSummary;
  rsvp_summary: RsvpSummary;
}

export interface GuestReportRow {
  guest_id: number;
  guest_name: string;
  category_name: string | null;
  family_member_count: number;
  invitation_status: "NOT_SENT" | "SENT" | "FAILED";
  response_status: GuestResponseStatusKey;
  channels_used: InvitationChannel[];
  reminders_sent: number;
}

export interface InvitationReport {
  event_id: number;
  event_name: string;
  total_guests: number;
  total_expected_headcount: number;
  send_summary: SendSummary;
  rsvp_summary: RsvpSummary;
  category_breakdown: CategoryReportBreakdown[];
  guest_details: GuestReportRow[];
}