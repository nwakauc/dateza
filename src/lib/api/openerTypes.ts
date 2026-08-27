/**
 * D8N Opener shapes from `d8n/docs/api/openapi.yaml` (SendOpenerRequest,
 * SendOpenerResponse / HookAcknowledgement, OpenerInboxResponse / ReceivedHook,
 * HookReplyRequest/Response, ConfiguredOpener).
 *
 * Product name is Opener. Internal engine codes (`already_hooked`,
 * `hook_rate_limited`, `incoming_hook`, `hook_unavailable`) stay on the
 * wire and must never be shown to members.
 */

export type OpenerState = "available" | "pending" | "hooked" | "unavailable";

export function parseOpenerState(value: unknown): OpenerState | undefined {
  if (value === "available" || value === "pending" || value === "hooked" || value === "unavailable") {
    return value;
  }
  return undefined;
}

/** Send is offered only when D8N says the viewer may send.
 *  `pending` = live outgoing opener; `hooked` = match/conversation exists;
 *  `unavailable` = one-per-pair already spent, incoming live opener, or already
 *  liked — D8N collapses those for privacy, so the client must not offer send.
 *  Missing `opener_state` stays sendable so POST remains the authority. */
export function openerSendAllowed(state: OpenerState | undefined): boolean {
  return state !== "pending" && state !== "hooked" && state !== "unavailable";
}

export function openerActionLabel(state: OpenerState | undefined): string {
  if (state === "pending") return "Opener already sent";
  if (state === "hooked") return "Conversation already open";
  if (state === "unavailable") return "Opener unavailable";
  return "Send opener";
}

export type ConfiguredOpener = {
  key: string;
  text: string;
};

export type OpenerAcknowledgement = {
  id: string;
  status: "pending";
  created_at: string;
  expires_at: string;
};

export type SendOpenerResponse = {
  opener: OpenerAcknowledgement;
};

export type ReceivedOpener = {
  id: string;
  message: string;
  created_at: string;
  expires_at: string;
  sender: import("./findTypes.ts").PublicProfile;
};

export type OpenerInboxResponse = {
  openers: ReceivedOpener[];
  next_cursor: string | null;
};
