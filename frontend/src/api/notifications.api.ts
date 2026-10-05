import { apiClient } from "./client";
import type { ApiResponse, PaginatedResponse, PaginationMeta } from "@/types/api.types";
import type {
  BulkSendBatchResult,
  BulkSendPayload,
  NotificationLog,
  SendActiveTemplatePayload,
} from "@/types/notification.types";

export async function sendInvitation(
  eventId: number,
  payload: SendActiveTemplatePayload
): Promise<NotificationLog> {
  const { data } = await apiClient.post<ApiResponse<NotificationLog>>(
    `/events/${eventId}/send-invitation/`,
    payload
  );

  return data.data;
}

/** Sends ONE batch of a bulk Email / SMS / Voice Call send. */
export async function sendBulkInvitationBatch(
  eventId: number,
  payload: BulkSendPayload
): Promise<BulkSendBatchResult> {
  const { data } = await apiClient.post<ApiResponse<BulkSendBatchResult>>(
    `/events/${eventId}/send-invitations/bulk/`,
    payload
  );

  return data.data;
}

export async function markWhatsAppSent(logId: number): Promise<NotificationLog> {
  const { data } = await apiClient.post<ApiResponse<NotificationLog>>(
    `/notification-logs/${logId}/mark-whatsapp-sent/`
  );

  return data.data;
}

export async function retryNotification(logId: number): Promise<NotificationLog> {
  const { data } = await apiClient.post<ApiResponse<NotificationLog>>(
    `/notification-logs/${logId}/retry/`
  );

  return data.data;
}

export interface NotificationLogsPage {
  logs: NotificationLog[];
  pagination: PaginationMeta;
}

export async function getEventNotificationLogs(
  eventId: number,
  page = 1
): Promise<NotificationLogsPage> {
  const { data } = await apiClient.get<PaginatedResponse<NotificationLog>>(
    `/events/${eventId}/notification-logs/`,
    { params: { page } }
  );

  return { logs: data.data, pagination: data.pagination };
}

// --------------------------------------------------
// Reminders (Phase 22)
// --------------------------------------------------

export async function sendReminder(
  eventId: number,
  payload: SendActiveTemplatePayload
): Promise<NotificationLog> {
  const { data } = await apiClient.post<ApiResponse<NotificationLog>>(
    `/events/${eventId}/send-reminder/`,
    payload
  );

  return data.data;
}

export async function sendPendingWhatsAppReminder(pendingId: number): Promise<NotificationLog> {
  const { data } = await apiClient.post<ApiResponse<NotificationLog>>(
    `/pending-whatsapp-reminders/${pendingId}/send/`
  );

  return data.data;
}