import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { setUnauthorizedListener } from "../../lib/api/client.ts";
import { setCsrfToken } from "../../lib/api/csrfStore.ts";
import { getCurrentIdentity } from "../../lib/api/me.ts";
import { ConfigError } from "../../lib/config.ts";
import { SessionContext } from "./SessionContext.ts";
import type { SessionState } from "./sessionState.ts";
import type { VerificationState } from "./verificationState.ts";

type Props = {
  children: ReactNode;
};

function failureState(error: unknown): SessionState {
  if (error instanceof ConfigError) {
    return { status: "unavailable", reason: "config" };
  }
  if (error instanceof ApiError) {
    return { status: "unavailable", reason: "server" };
  }
  return { status: "unavailable", reason: "network" };
}

type LoadedSession = {
  session: SessionState;
  verification: VerificationState;
};

async function loadSession(): Promise<LoadedSession> {
  try {
    const user = await getCurrentIdentity();
    // A fresh /me bootstrap (e.g. after a hard refresh) is the only place
    // that supplies a current CSRF token for a cookie session — capture it
    // here so every subsequent unsafe request has it, without pages having
    // to know this is happening.
    if (user.session.authentication_mode === "cookie") {
      setCsrfToken(user.session.csrf_token);
    }
    const verification: VerificationState = user.identifier && user.verification
      ? {
          status: "known",
          kind: user.identifier.kind,
          verified: user.identifier.verified,
          maskedDestination: user.identifier.masked_destination,
          codeDispatched: user.verification.code_dispatched,
          resendAvailableIn: user.verification.resend_available_in,
        }
      : { status: "unknown" };
    return { session: { status: "authenticated", user }, verification };
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      return { session: { status: "unauthenticated" }, verification: { status: "unknown" } };
    }
    return { session: failureState(error), verification: { status: "unknown" } };
  }
}

export function SessionProvider({ children }: Props) {
  const [session, setSession] = useState<SessionState>({ status: "unknown" });
  const [verification, setVerification] = useState<VerificationState>({ status: "unknown" });

  const refreshSession = useCallback(async () => {
    const next = await loadSession();
    setSession(next.session);
    setVerification(next.verification);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setUnauthorizedListener(() => {
      setSession({ status: "unauthenticated" });
      setVerification({ status: "unknown" });
    });

    void loadSession().then((next) => {
      if (!cancelled) {
        setSession(next.session);
        setVerification(next.verification);
      }
    });

    return () => {
      cancelled = true;
      setUnauthorizedListener(undefined);
    };
  }, []);

  const value = useMemo(
    () => ({ session, refreshSession, verification, setVerification }),
    [session, refreshSession, verification],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
