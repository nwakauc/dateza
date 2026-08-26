import { ApiError } from "../../lib/api/errors.ts";

export function onboardingErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isUnauthorized) {
      return "Your session ended. Sign in again to continue.";
    }
    if (error.status === 429 || error.code === "rate_limited") {
      return "Too many attempts. Wait a moment and try again.";
    }
    if (error.status === 403) {
      return "We could not update this profile yet. Finish the earlier step and try again.";
    }
    if (error.details) {
      const first = Object.values(error.details).flat()[0];
      if (first) {
        return first;
      }
    }
    if (error.status >= 500) {
      return "Something went wrong. Please try again in a moment.";
    }
  }
  if (error instanceof TypeError) {
    return "We could not reach DateZA. Check your connection and try again.";
  }
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "We could not reach DateZA. Check your connection and try again.";
  }
  return "Something went wrong. Please try again in a moment.";
}

export function fieldError(details: Record<string, string[]> | undefined, key: string): string | undefined {
  const messages = details?.[key];
  const message = messages && messages.length > 0 ? messages[0] : undefined;
  if (!message) {
    return undefined;
  }
  if (key === "birthdate" && /18/.test(message)) {
    return "You need to be 18 or older.";
  }
  if (key === "country_code") {
    return "Choose your country from the list.";
  }
  if (key === "interested_in") {
    return "Choose who you want to meet.";
  }
  return message;
}
