import { useCallback, useState } from "react";
import { useSession } from "../session/useSession.ts";
import { canInteract } from "../session/verificationState.ts";

export type GateReason = "like" | "pass" | "profile";

/**
 * The single interaction boundary for verification-gated actions. Discovery
 * and profile-card components call `requireVerified` instead of each
 * re-implementing an unverified check; unverified attempts open the shared
 * verification prompt instead of hitting the server.
 */
export function useVerificationGate() {
  const { verification } = useSession();
  const [pendingReason, setPendingReason] = useState<GateReason | null>(null);
  const verified = canInteract(verification);

  const requireVerified = useCallback(
    (reason: GateReason, action: () => void) => {
      if (verified) {
        action();
        return;
      }
      setPendingReason(reason);
    },
    [verified],
  );

  const openPrompt = useCallback((reason: GateReason) => setPendingReason(reason), []);
  const dismiss = useCallback(() => setPendingReason(null), []);

  return { verified, verification, pendingReason, requireVerified, openPrompt, dismiss };
}
