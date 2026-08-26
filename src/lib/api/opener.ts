/**
 * DateZA opener boundary.
 *
 * D8N does not currently expose a DateZA opener (pre-match message) API.
 * Conversations start only after a mutual match via
 * `POST /api/v1/matches/{id}/conversation`. This module is the frontend
 * contract the Find UX calls — it must not hit HookUs Hook endpoints, must
 * not invent a successful send, and must not persist fake opener state.
 *
 * Desired (not live) contract for backend:
 * - send: POST an opener to a profile with `{ message }`
 * - read: opener status for a pair — none | sent | waiting | replied | unlocked
 * - include opener_id / conversation_id when a thread is created
 */
export const DATEZA_OPENER_SUPPORTED = false;

export class OpenerUnavailableError extends Error {
  readonly code = "opener_unsupported";

  constructor() {
    super("DateZA does not yet support sending an opener before a match.");
    this.name = "OpenerUnavailableError";
  }
}

export type OpenerStatus = "none" | "sent" | "waiting" | "replied" | "unlocked";

export type OpenerSendResult = {
  status: "sent" | "waiting" | "unlocked";
  opener_id: string;
  conversation_id: string | null;
};

export type OpenerThread = {
  profile_id: string;
  status: OpenerStatus;
  message: string | null;
  opener_id: string | null;
  conversation_id: string | null;
};

/** Always rejects until D8N ships a DateZA opener capability. */
export function sendOpener(profileId: string, message: string): Promise<OpenerSendResult> {
  if (!profileId || !message.trim()) {
    return Promise.reject(new OpenerUnavailableError());
  }
  return Promise.reject(new OpenerUnavailableError());
}

/** Always empty until D8N ships opener read state. */
export function getOpenerThread(_profileId: string): Promise<OpenerThread> {
  return Promise.resolve({
    profile_id: _profileId,
    status: "none",
    message: null,
    opener_id: null,
    conversation_id: null,
  });
}
