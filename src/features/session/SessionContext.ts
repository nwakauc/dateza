import { createContext } from "react";
import type { SessionState } from "./sessionState.ts";
import type { VerificationState } from "./verificationState.ts";

export type SessionContextValue = {
  session: SessionState;
  refreshSession: () => Promise<void>;
  verification: VerificationState;
  setVerification: (next: VerificationState) => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
