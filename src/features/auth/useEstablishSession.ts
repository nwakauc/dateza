import { useCallback } from "react";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import type { PasswordAuthSessionResponse } from "../../lib/api/types.ts";
import { useSession } from "../session/useSession.ts";

/**
 * D8N's register/login response already carries verification state
 * (`identifier`, `verification_required`, and dispatch timing). Capture the
 * response immediately, then reconcile it with the authenticated `/me` state.
 *
 * `authSession.token` is `null` under `session_mode: "browser"` (DateZA
 * web's normal mode) — the server already set the HttpOnly session cookie
 * on this same response, so there is nothing to store here. `refreshSession`
 * below re-authenticates via that cookie and picks up the CSRF token.
 */
export function useEstablishSession() {
  const { refreshSession, setVerification } = useSession();

  return useCallback(
    async (authSession: PasswordAuthSessionResponse) => {
      if (authSession.token) {
        setBearerToken(authSession.token);
      }
      setVerification({
        status: "known",
        kind: authSession.identifier.kind,
        verified: authSession.identifier.verified,
        maskedDestination: authSession.identifier.masked_destination,
        codeDispatched: authSession.verification.code_dispatched,
        resendAvailableIn: authSession.verification.resend_available_in,
      });
      await refreshSession();
    },
    [refreshSession, setVerification],
  );
}
