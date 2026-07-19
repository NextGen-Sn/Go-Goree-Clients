import { ApiError } from "@/api/client";

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.errors) {
      const firstMessage = Object.values(error.errors).flat()[0];
      if (firstMessage) return firstMessage;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue.";
}

export function getRetryAfterSeconds(error: unknown): number | null {
  return error instanceof ApiError && error.retryAfter ? error.retryAfter : null;
}
