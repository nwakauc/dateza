import { ApiError } from "../../lib/api/errors.ts";

export type VerificationIssueKind =
  | "invalid"
  | "expired"
  | "used"
  | "attempts_exhausted"
  | "resend_too_soon"
  | "rate_limited"
  | "delivery_unavailable"
  | "unavailable";

export type VerificationIssue = {
  kind: VerificationIssueKind;
  title: string;
  body: string;
  retryAfterSeconds?: number;
};

const UNAVAILABLE: VerificationIssue = {
  kind: "unavailable",
  title: "We couldn't verify your code.",
  body: "Please try again.",
};

export function verificationIssue(error: unknown): VerificationIssue {
  if (!(error instanceof ApiError)) return UNAVAILABLE;

  switch (error.code) {
    case "verification_code_invalid":
    case "invalid_code":
      return { kind: "invalid", title: "That code isn't right.", body: "Check the code and try again." };
    case "verification_code_expired":
      return {
        kind: "expired",
        title: "That code has expired.",
        body: "Request a new verification code to continue.",
      };
    case "verification_code_used":
      return {
        kind: "used",
        title: "That code has already been used.",
        body: "Request a new verification code to continue.",
      };
    case "verification_attempts_exhausted":
      return {
        kind: "attempts_exhausted",
        title: "That code is no longer available.",
        body: "Request a new verification code to continue.",
      };
    case "verification_resend_too_soon":
      return {
        kind: "resend_too_soon",
        title: "Your next code will be ready soon.",
        body: "Wait for the countdown, then request a new code.",
        retryAfterSeconds: error.retryAfterSeconds,
      };
    case "verification_rate_limited":
    case "rate_limited":
      return {
        kind: "rate_limited",
        title: "Too many code requests.",
        body: "Wait a little while before trying again.",
        retryAfterSeconds: error.retryAfterSeconds,
      };
    case "delivery_unavailable":
      return {
        kind: "delivery_unavailable",
        title: "We couldn't send a new code.",
        body: "Please try again shortly.",
      };
    default:
      return UNAVAILABLE;
  }
}

export function requestCodeIssue(error: unknown): VerificationIssue {
  const issue = verificationIssue(error);
  if (issue.kind === "invalid" || issue.kind === "expired" || issue.kind === "used") {
    return {
      kind: "unavailable",
      title: "We couldn't send a new code.",
      body: "Please try again shortly.",
    };
  }
  return issue;
}
