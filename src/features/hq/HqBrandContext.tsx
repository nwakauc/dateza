import { useMemo, type ReactNode } from "react";
import { useSession } from "../session/useSession.ts";
import { HqOperatorContext, type HqOperatorContextValue } from "./hqBrandContextValue.ts";

/**
 * HQ brand context is host-derived (Current.brand on the API).
 * This provider only surfaces the signed-in session brand for display —
 * selecting another brand is not a client-side grant.
 */
export function HqBrandProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();

  const value = useMemo<HqOperatorContextValue>(() => {
    if (session.status === "unknown") {
      return {
        status: "loading",
        brandSlug: null,
        brandName: null,
        operatorLabel: "Operator",
        errorMessage: null,
      };
    }
    if (session.status === "unavailable") {
      return {
        status: "unavailable",
        brandSlug: null,
        brandName: null,
        operatorLabel: "Operator",
        errorMessage: "Could not confirm your session.",
      };
    }
    if (session.status === "unauthenticated") {
      return {
        status: "unauthenticated",
        brandSlug: null,
        brandName: null,
        operatorLabel: "Operator",
        errorMessage: null,
      };
    }
    const masked = session.user.identifier?.masked_destination;
    return {
      status: "ready",
      brandSlug: session.user.brand.slug,
      brandName: session.user.brand.name,
      operatorLabel: masked ?? `User ${session.user.user_id}`,
      errorMessage: null,
    };
  }, [session]);

  return <HqOperatorContext.Provider value={value}>{children}</HqOperatorContext.Provider>;
}
