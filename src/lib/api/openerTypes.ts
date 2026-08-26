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

/** Send is offered unless D8N already has a live outgoing opener or an
 *  unlocked conversation. `unavailable` is not a client-side lock: like is
 *  independent, and the POST is the authority (409/404 copy on failure). */
export function openerSendAllowed(state: OpenerState | undefined): boolean {
  return state !== "pending" && state !== "hooked";
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
