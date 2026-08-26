import type { IdentifierKind } from "../../lib/api/types.ts";

/**
 * D8N owns verification lifecycle and returns only a masked destination plus
 * resend timing. Session credentials remain in D8N's HttpOnly cookie under
 * ADR-0003.
 */
export type VerificationState =
  | { status: "unknown" }
  | {
      status: "known";
      kind: IdentifierKind;
      verified: boolean;
      maskedDestination: string;
      codeDispatched: boolean;
      resendAvailableIn: number;
    };

/** Single source of truth for whether the member may Like, view full profile
 * detail, or use other verification-gated interactions. */
export function canInteract(verification: VerificationState): boolean {
  return verification.status === "known" && verification.verified;
}
