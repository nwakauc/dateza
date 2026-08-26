import type { MeResponse } from "../../lib/api/types.ts";

export type SessionState =
  | { status: "unknown" }
  | { status: "unauthenticated" }
  | { status: "unavailable"; reason: "network" | "server" }
  | { status: "authenticated"; user: MeResponse };
