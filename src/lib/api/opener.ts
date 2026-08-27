import { apiRequest } from "./client.ts";
import { ApiError } from "./errors.ts";
import { parsePublicProfile } from "./find.ts";
import type { Conversation, Message } from "./socialTypes.ts";
import { parseConversation, parseMessage } from "./social.ts";
import type {
  ConfiguredOpener,
  OpenerAcknowledgement,
  OpenerInboxResponse,
  ReceivedOpener,
  SendOpenerResponse,
} from "./openerTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseConfiguredOpeners(value: unknown): ConfiguredOpener[] {
  if (!Array.isArray(value)) return [];
  const openers: ConfiguredOpener[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.key !== "string" || !item.key) continue;
    const text =
      typeof item.text === "string" && item.text.trim()
        ? item.text
        : typeof item.label === "string" && item.label.trim()
          ? item.label
          : "";
    if (!text) continue;
    openers.push({ key: item.key, text });
  }
  return openers;
}

function parseAcknowledgement(value: unknown): OpenerAcknowledgement {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    value.status !== "pending" ||
    typeof value.created_at !== "string" ||
    typeof value.expires_at !== "string"
  ) {
    throw new ApiError(502, undefined, "invalid_opener_response");
  }
  return {
    id: value.id,
    status: "pending",
    created_at: value.created_at,
    expires_at: value.expires_at,
  };
}

function parseReceivedOpener(value: unknown): ReceivedOpener {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.message !== "string" ||
    typeof value.created_at !== "string" ||
    typeof value.expires_at !== "string"
  ) {
    throw new ApiError(502, undefined, "invalid_opener_response");
  }
  return {
    id: value.id,
    message: value.message,
    created_at: value.created_at,
    expires_at: value.expires_at,
    sender: parsePublicProfile(value.sender),
  };
}

/** POST /api/v1/profiles/{profile_id}/opener — `{ opener_key }` only. */
export function sendOpener(profileId: string, openerKey: string): Promise<SendOpenerResponse> {
  return apiRequest(`/api/v1/profiles/${encodeURIComponent(profileId)}/opener`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opener_key: openerKey }),
  }).then((data) => {
    if (!isRecord(data)) throw new ApiError(502, undefined, "invalid_opener_response");
    return { opener: parseAcknowledgement(data.opener) };
  });
}

/** GET /api/v1/openers — recipient inbox of live pending openers. */
export function listReceivedOpeners(cursor?: string): Promise<OpenerInboxResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest(`/api/v1/openers${query}`).then((data) => {
    if (!isRecord(data) || !Array.isArray(data.openers)) {
      throw new ApiError(502, undefined, "invalid_opener_response");
    }
    return {
      openers: data.openers.map(parseReceivedOpener),
      next_cursor: typeof data.next_cursor === "string" ? data.next_cursor : null,
    };
  });
}

/** POST /api/v1/openers/{opener_id}/reply — `{ message }`; unlocks conversation. */
export function replyToOpener(openerId: string, message: string): Promise<{ conversation: Conversation; message: Message }> {
  return apiRequest(`/api/v1/openers/${encodeURIComponent(openerId)}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  }).then((data) => {
    if (!isRecord(data)) throw new ApiError(502, undefined, "invalid_opener_response");
    return {
      conversation: parseConversation(data.conversation),
      message: parseMessage(data.message),
    };
  });
}

/** POST /api/v1/openers/{opener_id}/decline — 204, nothing disclosed to sender. */
export function declineOpener(openerId: string): Promise<void> {
  return apiRequest(`/api/v1/openers/${encodeURIComponent(openerId)}/decline`, { method: "POST" }).then(() => undefined);
}

/** After these send failures, offering another send is misleading. */
export function openerSendClosed(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "already_liked" ||
      error.code === "already_hooked" ||
      error.code === "already_matched" ||
      error.code === "incoming_hook" ||
      error.code === "opener_not_configured" ||
      error.code === "profile_unavailable")
  );
}

export function openerSendErrorCopy(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "We couldn’t send that opener. Try again.";
  }
  switch (error.code) {
    case "already_hooked":
      return "You’ve already sent this person an opener.";
    case "incoming_hook":
      return "They’ve already reached out. Check Chats to reply.";
    case "already_liked":
      return "You’ve already liked them. Openers aren’t available after a like.";
    case "already_matched":
      return "You’re already in a conversation with them.";
    case "hook_rate_limited":
      return "You’ve sent all the openers you can for now. Try again later.";
    case "invalid_opener":
      return "That opener isn’t available. Pick another.";
    case "opener_not_configured":
      return "Openers aren’t available right now.";
    case "profile_unavailable":
      return "This profile isn’t available.";
    default:
      return "We couldn’t send that opener. Try again.";
  }
}

export function openerReplyErrorCopy(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "That reply didn’t send. Try again.";
  }
  switch (error.code) {
    case "message_blank":
      return "Write a reply before sending.";
    case "message_too_long":
      return "That reply is too long. Shorten it and try again.";
    case "hook_unavailable":
      return "This opener isn’t available anymore.";
    case "opener_not_configured":
      return "Openers aren’t available right now.";
    default:
      return "That reply didn’t send. Try again.";
  }
}

export function openerDeclineErrorCopy(error: unknown): string {
  if (error instanceof ApiError && error.code === "hook_unavailable") {
    return "This opener isn’t available anymore.";
  }
  return "We couldn’t decline that. Try again.";
}
