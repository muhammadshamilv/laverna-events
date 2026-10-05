import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "@/types/api.types";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const payload = error.response?.data;

    if (payload?.errors) {
      const firstField = Object.values(payload.errors)[0];

      if (Array.isArray(firstField) && firstField.length > 0) {
        return firstField[0];
      }
    }

    if (payload?.message) {
      return payload.message;
    }
  }

  return fallback;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (isAxiosError<ApiErrorResponse>(error)) {
    const errors = error.response?.data?.errors;

    if (errors) {
      for (const [field, messages] of Object.entries(errors)) {
        if (Array.isArray(messages) && messages.length > 0) {
          fieldErrors[field] = messages[0];
        }
      }
    }
  }

  return fieldErrors;
}
