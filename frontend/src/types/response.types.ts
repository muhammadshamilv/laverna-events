export type GuestResponseStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "MAYBE";

export interface InvitationPublicDetails {
  guest_name: string;
  event_name: string;
  event_type: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  address: string;
  google_maps_link: string;
  invitation_image: string | null;
  response_status: GuestResponseStatus;
  already_responded: boolean;
  calendar_url: string;
}

export interface SubmitResponsePayload {
  response: "ACCEPTED" | "REJECTED" | "MAYBE";
}

export interface SubmitResponseResult {
  response_status: GuestResponseStatus;
}