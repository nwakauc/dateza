import { useCallback } from "react";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import type { PasswordAuthSessionResponse } from "../../lib/api/types.ts";
import { useSession } from "../session/useSession.ts";

/**
 * D8N's register/login response already carries verification state
 * (`identifier`, `verification_required`) that `GET /api/v1/me` never
 * returns, so it's captured here rather than re-derived later.
 */
export function useEstablishSession() {
  const { refreshSession, setVerification } = useSession();

  return useCallback(
    async (authSession: PasswordAuthSessionResponse, rawIdentifier: string) => {
      setBearerToken(authSession.token);
      setVerification({
        status: "known",
        kind: authSession.identifier.kind,
        verified: authSession.identifier.verified,
        rawIdentifier,
      });
      await refreshSession();
    },
    [refreshSession, setVerification],
  );
}
