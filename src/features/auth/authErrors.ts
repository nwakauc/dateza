import { ApiError } from "../../lib/api/errors.ts";

const GENERIC =
  "Something went wrong. Please try again in a moment.";
const NETWORK =
  "We could not reach DateZA. Check your connection and try again.";
const RATE_LIMITED =
  "Too many attempts. Wait a moment and try again.";
const METHOD_UNAVAILABLE =
  "This sign-in method is not available for DateZA right now.";

export function unexpectedAuthMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429 || error.code === "rate_limited") {
      return RATE_LIMITED;
    }
    if (error.code === "auth_method_unavailable" || error.code === "brand_required") {
      return METHOD_UNAVAILABLE;
    }
    if (error.status >= 500) {
      return GENERIC;
    }
  }
  if (error instanceof TypeError) {
    return NETWORK;
  }
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return NETWORK;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return NETWORK;
  }
  return GENERIC;
}

export function signUpErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 422 || error.code === "registration_unavailable") {
      return "We could not create this account. Check your details, or sign in if you already use DateZA.";
    }
    if (error.status === 409 || error.code === "already_authenticated") {
      return "You are already signed in.";
    }
  }
  return unexpectedAuthMessage(error);
}

export function signInErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.code === "invalid_credentials")) {
    return "That phone, email, or password did not match. Try again.";
  }
  return unexpectedAuthMessage(error);
}

export function recoveryRequestErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 422 || error.code === "invalid_request")) {
    return "Enter the phone number or email for your DateZA account.";
  }
  return unexpectedAuthMessage(error);
}

export function recoveryVerifyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "verification_code_expired") {
      return "That recovery code has expired. Request a new one to continue.";
    }
    if (error.code === "verification_code_used") {
      return "That recovery code has already been used. Start password recovery again.";
    }
    if (error.code === "verification_attempts_exhausted") {
      return "That recovery code is no longer available. Request a new one to continue.";
    }
    if (error.status === 401 || error.code === "invalid_code") {
      return "That recovery code isn't right. Check the code and try again.";
    }
  }
  return unexpectedAuthMessage(error);
}

export function recoveryResetErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.code === "invalid_or_expired_token") {
      return "This reset step has expired. Start password recovery again.";
    }
    if (error.status === 422 || error.code === "invalid_password") {
      return "Choose a password of at least 6 characters, and make sure both fields match.";
    }
  }
  return unexpectedAuthMessage(error);
}
