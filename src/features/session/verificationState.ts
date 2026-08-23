import type { IdentifierKind } from "../../lib/api/types.ts";

/**
 * D8N never echoes a user's raw email/phone back to the client (register,
 * login, and /api/v1/me all omit it) and the bearer session is memory-only
 * (ADR-0002), so this state only ever reflects what happened earlier in the
 * *current* tab: a register/login response, or a later verification result.
 * There is no server endpoint to independently "look up" verification state.
 */
export type VerificationState =
  | { status: "unknown" }
  | {
      status: "known";
      kind: IdentifierKind;
      verified: boolean;
      /** The exact string the member typed at sign-in/sign-up, kept only for
       * masked display (e.g. "u••••@gmail.com"). Never sent anywhere. */
      rawIdentifier: string;
    };

/** Single source of truth for whether the member may Like, view full profile
 * detail, or use other verification-gated interactions. */
export function canInteract(verification: VerificationState): boolean {
  return verification.status === "known" && verification.verified;
}
