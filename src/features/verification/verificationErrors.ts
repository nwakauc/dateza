import { ApiError } from "../../lib/api/errors.ts";

export function requestCodeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429 || error.code === "rate_limited") {
      return "Too many attempts. Wait a moment and try again.";
    }
    if (error.status === 503 || error.code === "delivery_unavailable") {
      return "We could not send a code right now. Try again shortly.";
    }
  }
  return "We could not send a code right now. Try again shortly.";
}

export function verifyCodeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429 || error.code === "rate_limited") {
      return "Too many attempts. Wait a moment and try again.";
    }
    if (error.status === 401 || error.code === "invalid_code") {
      return "That code isn't right. Try again.";
    }
  }
  return "That code isn't right. Try again.";
}
