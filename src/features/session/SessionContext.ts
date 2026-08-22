import { createContext } from "react";
import type { SessionState } from "./sessionState.ts";

export type SessionContextValue = {
  session: SessionState;
  refreshSession: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
