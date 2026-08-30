import { ApiError } from "../../lib/api/errors.ts";

export function identifierChangeErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === "invalid_current_password") return "Your password is incorrect.";
  if (error.code === "password_credential_required") {
    return "This account cannot change its sign-in contact here.";
  }
  if (error.code === "email_change_unavailable") {
    return "That email is not available or is the same as your current one.";
  }
  if (error.code === "phone_change_unavailable") {
    return "That phone number is not available or is the same as your current one.";
  }
  if (error.code === "verification_code_invalid") return "That code is incorrect.";
  if (error.code === "verification_code_expired") return "That code has expired. Request a new one.";
  if (error.code === "verification_code_used") return "That code has already been used.";
  if (error.status === 429 || error.code === "rate_limited") {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (error.code === "delivery_unavailable") {
    return "We couldn't send a code right now. Try again shortly.";
  }
  return fallback;
}
