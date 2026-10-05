// Field names here must match photographers/serializers.py exactly.

export interface PhotographerSummary {
    id: number;
    full_name: string;
    mobile_number: string;
    email: string;
  }
  
  export interface PhotographerAccessGrant {
    id: number;
    photographer: PhotographerSummary;
    granted_by: number;
    is_active: boolean;
    expires_at: string | null;
    is_currently_valid: boolean;
    created_at: string;
  }
  
  export interface GrantPhotographerAccessPayload {
    mobile_number: string;
    expires_at?: string | null;
  }
  
  // The event shape returned by EventSummarySerializer on the
  // photographer-facing "my events" endpoint - deliberately narrower than
  // the full Event type (no address/description/etc), matching exactly
  // what that serializer exposes.
  export interface PhotographerEventSummary {
    id: number;
    name: string;
    event_type: string;
    event_date: string;
    event_time: string;
    venue_name: string;
    cover_image: string | null;
  }
  
  export interface PhotographerEventGrant {
    id: number;
    event: PhotographerEventSummary;
    expires_at: string | null;
    is_currently_valid: boolean;
    created_at: string;
  }
  