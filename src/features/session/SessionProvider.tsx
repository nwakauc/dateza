import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { setUnauthorizedListener } from "../../lib/api/client.ts";
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

async function loadSession(): Promise<SessionState> {
  try {
    const user = await getCurrentIdentity();
    return { status: "authenticated", user };
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      return { status: "unauthenticated" };
    }
    return failureState(error);
  }
}

export function SessionProvider({ children }: Props) {
  const [session, setSession] = useState<SessionState>({ status: "unknown" });
  const [verification, setVerification] = useState<VerificationState>({ status: "unknown" });

  const refreshSession = useCallback(async () => {
    const next = await loadSession();
    setSession(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setUnauthorizedListener(() => {
      setSession({ status: "unauthenticated" });
      setVerification({ status: "unknown" });
    });

    void loadSession().then((next) => {
      if (!cancelled) {
        setSession(next);
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
