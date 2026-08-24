import { useContext } from "react";
import { OwnAccountContext } from "./OwnAccountContext.ts";

/** Own display name, avatar, and RealMe/onboarding state, shared by every
 * screen inside AppShell so the top nav, bottom tab bar, and Profile page
 * don't each re-fetch it. */
export function useOwnAccount() {
  const value = useContext(OwnAccountContext);
  if (!value) {
    throw new Error("useOwnAccount must be used within AppShell.");
  }
  return value;
}
