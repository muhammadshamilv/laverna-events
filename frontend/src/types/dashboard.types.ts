// Field names here must match dashboard/serializers.py's
// OrganizerOverviewSerializer exactly - total_accepted and
// total_expected_attendance, NOT accepted_count/expected_attendance (those
// names belong to EventDashboardStats below, a different serializer with
// different field names for the same underlying concepts).
export interface OrganizerOverview {
  total_events: number;
  total_guests: number;
  total_accepted: number;
  total_expected_attendance: number;
}

export interface EventDashboardStats {
  total_guests: number;
  accepted_count: number;
  invitations_sent: number;
  notifications_sent: number;
  expected_attendance: number;
}

// --------------------------------------------------
// Phase 25: invitation-focused dashboard overhaul
// --------------------------------------------------

export type InvitationChannelKey = "WHATSAPP" | "EMAIL" | "SMS" | "VOICE_CALL";

export interface ChannelTotals {
  sent: number;
  failed: number;
}

export type ChannelPerformance = Record<InvitationChannelKey, ChannelTotals>;

export interface EventNeedingAttention {
  event_id: number;
  event_name: string;
  event_date: string;
  total_guests: number;
  pending_count: number;
  pending_rate: number;
  pending_whatsapp_reminders: number;
}

export interface QuotaUsage {
  plan_name: string;
  invitations_used: number;
  invitations_total: number | null;
  invitations_remaining: number | null;
  voice_calls_used: number;
  voice_calls_total: number | null;
  voice_calls_remaining: number | null;
  expires_at: string;
}

export interface OrganizerInvitationOverview extends OrganizerOverview {
  pending_whatsapp_reminders: number;
  channel_performance: ChannelPerformance;
  events_needing_attention: EventNeedingAttention[];
  quota_usage: QuotaUsage | null;
  generated_at: string;
}