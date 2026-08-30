import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchHqOperator } from "../../lib/hq/api.ts";
import { ApiError } from "../../lib/api/errors.ts";
import type { HqCurrentOperator } from "../../lib/hq/types.ts";
import { useSession } from "../session/useSession.ts";
import { HqOperatorContext } from "./hqOperatorContext.ts";
import type { HqOperatorContextValue } from "./hqOperatorContextValue.ts";

export function HqOperatorProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session.status === "authenticated" ? session.user.user_id : null;
  const [probe, setProbe] = useState<{ userId: number; operator: HqCurrentOperator } | null>(null);
  const [failedUserId, setFailedUserId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userId === null) {
      return;
    }

    let cancelled = false;
    void fetchHqOperator()
      .then((operator) => {
        if (!cancelled) {
          setProbe({ userId, operator });
          setFailedUserId(null);
          setErrorMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setProbe(null);
        setFailedUserId(userId);
        if (error instanceof ApiError && error.status === 403) {
          setErrorMessage("This account is not authorized for HQ on this brand.");
        } else {
          setErrorMessage("Could not load your operator session. Try again.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (userId === null) {
      return;
    }

    try {
      const operator = await fetchHqOperator();
      setProbe({ userId, operator });
      setFailedUserId(null);
      setErrorMessage(null);
    } catch (error) {
      setProbe(null);
      setFailedUserId(userId);
      if (error instanceof ApiError && error.status === 403) {
        setErrorMessage("This account is not authorized for HQ on this brand.");
      } else {
        setErrorMessage("Could not load your operator session. Try again.");
      }
    }
  }, [userId]);

  const value = useMemo<HqOperatorContextValue>(() => {
    const brandName = session.status === "authenticated" ? session.user.brand.name : null;
    const operatorLabel =
      session.status === "authenticated"
        ? (session.user.identifier?.masked_destination ?? `User ${session.user.user_id}`)
        : "Operator";

    if (userId === null) {
      return {
        status: "unavailable",
        brandSlug: null,
        brandName,
        operatorLabel,
        operator: null,
        errorMessage: "Sign in to continue.",
        refresh,
      };
    }

    if (probe?.userId === userId) {
      return {
        status: "ready",
        brandSlug: probe.operator.current_brand,
        brandName,
        operatorLabel,
        operator: probe.operator,
        errorMessage: null,
        refresh,
      };
    }

    if (failedUserId === userId) {
      return {
        status: "unavailable",
        brandSlug: session.status === "authenticated" ? session.user.brand.slug : null,
        brandName,
        operatorLabel,
        operator: null,
        errorMessage: errorMessage ?? "Could not load your operator session.",
        refresh,
      };
    }

    return {
      status: "loading",
      brandSlug: session.status === "authenticated" ? session.user.brand.slug : null,
      brandName,
      operatorLabel,
      operator: null,
      errorMessage: null,
      refresh,
    };
  }, [errorMessage, failedUserId, probe, refresh, session, userId]);

  return <HqOperatorContext.Provider value={value}>{children}</HqOperatorContext.Provider>;
}
