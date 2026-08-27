import { parseMessageAttachments } from "./chatMedia.ts";
import type { SendMessageInput } from "./chatMediaTypes.ts";
import { apiRequest } from "./client.ts";
import { ApiError } from "./errors.ts";
import { parseCompatibility, parsePublicProfile } from "./find.ts";
import type {
  Conversation,
  ConversationListResponse,
  ConversationRelationshipState,
  LikeListItem,
  LikeListResponse,
  MatchListResponse,
  Message,
  MessageListResponse,
  MessagePreview,
  MessageReplyTo,
} from "./socialTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function nullableString(value: unknown): string | null { return typeof value === "string" ? value : null; }

function parseMessageBody(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return undefined;
}

function parseRelationshipState(value: unknown): ConversationRelationshipState {
  return value === "ended" ? "ended" : "active";
}

function parseReplyTo(value: unknown): MessageReplyTo | null {
  if (value == null) return null;
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.sender_id !== "string") return null;
  if (value.message_type !== "text" && value.message_type !== "media") return null;
  if (typeof value.deleted !== "boolean") return null;
  const excerpt = value.body_excerpt;
  if (excerpt != null && typeof excerpt !== "string") return null;
  return {
    id: value.id,
    sender_id: value.sender_id,
    message_type: value.message_type,
    body_excerpt: excerpt ?? null,
    deleted: value.deleted,
  };
}

export function parseMessage(value: unknown): Message {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.conversation_id !== "string" || typeof value.sender_id !== "string" || typeof value.created_at !== "string") {
    throw new ApiError(502, undefined, "invalid_message_response");
  }
  const body = parseMessageBody(value.body);
  if (body === undefined) throw new ApiError(502, undefined, "invalid_message_response");
  return {
    id: value.id,
    conversation_id: value.conversation_id,
    sender_id: value.sender_id,
    body,
    created_at: value.created_at,
    attachments: parseMessageAttachments(value.attachments),
    reply_to: parseReplyTo(value.reply_to),
  };
}

function parseMessagePreview(value: unknown): MessagePreview | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.created_at !== "string") return null;
  const body = parseMessageBody(value.body);
  if (body === undefined) return null;
  return {
    id: value.id,
    sender_id: nullableString(value.sender_id),
    body,
    created_at: value.created_at,
    attachments: parseMessageAttachments(value.attachments),
  };
}

export function parseConversation(value: unknown): Conversation {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.match_id !== "string" || (value.status !== "active" && value.status !== "closed") || typeof value.created_at !== "string") throw new ApiError(502, undefined, "invalid_conversation_response");
  return {
    id: value.id,
    match_id: value.match_id,
    status: value.status,
    relationship_state: parseRelationshipState(value.relationship_state),
    created_at: value.created_at,
    profile: parsePublicProfile(value.profile),
    last_message: value.last_message == null ? null : parseMessagePreview(value.last_message),
  };
}

export function listMatches(cursor?: string): Promise<MatchListResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest(`/api/v1/matches${query}`).then((data) => {
    if (!isRecord(data) || !Array.isArray(data.matches)) throw new ApiError(502, undefined, "invalid_match_response");
    return { matches: data.matches.map((value) => {
      if (!isRecord(value) || typeof value.id !== "string" || typeof value.matched_at !== "string") throw new ApiError(502, undefined, "invalid_match_response");
      return { id: value.id, matched_at: value.matched_at, profile: parsePublicProfile(value.profile) };
    }), next_cursor: nullableString(data.next_cursor) };
  });
}

export function startConversation(matchId: string): Promise<Conversation> {
  return apiRequest(`/api/v1/matches/${encodeURIComponent(matchId)}/conversation`, { method: "POST" }).then((data) => {
    if (!isRecord(data)) throw new ApiError(502, undefined, "invalid_conversation_response");
    return parseConversation(data.conversation);
  });
}

/**
 * POST /api/v1/matches/{match_id}/unmatch — ends the Match without creating
 * a Block. 204, including when the Match is already ended.
 */
export function unmatchMatch(matchId: string): Promise<void> {
  return apiRequest(`/api/v1/matches/${encodeURIComponent(matchId)}/unmatch`, { method: "POST" }).then(() => undefined);
}

function parseLikeListItem(value: unknown): LikeListItem {
  if (!isRecord(value) || typeof value.liked_at !== "string") {
    throw new ApiError(502, undefined, "invalid_like_list_response");
  }
  const profile = parsePublicProfile(value.profile);
  const record = isRecord(value.profile) ? value.profile : {};
  return {
    liked_at: value.liked_at,
    profile: {
      ...profile,
      compatibility: parseCompatibility(record.compatibility),
    },
  };
}

function listLikes(path: "/api/v1/likes/incoming" | "/api/v1/likes/outgoing", cursor?: string): Promise<LikeListResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest(`${path}${query}`).then((data) => {
    if (!isRecord(data) || !Array.isArray(data.likes)) {
      throw new ApiError(502, undefined, "invalid_like_list_response");
    }
    return { likes: data.likes.map(parseLikeListItem), next_cursor: nullableString(data.next_cursor) };
  });
}

/** GET /api/v1/likes/incoming — people with an active Like toward the viewer. */
export function listIncomingLikes(cursor?: string): Promise<LikeListResponse> {
  return listLikes("/api/v1/likes/incoming", cursor);
}

/** GET /api/v1/likes/outgoing — people the viewer has Liked who are not yet a Match. */
export function listOutgoingLikes(cursor?: string): Promise<LikeListResponse> {
  return listLikes("/api/v1/likes/outgoing", cursor);
}

export function listConversations(cursor?: string): Promise<ConversationListResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest(`/api/v1/conversations${query}`).then((data) => {
    if (!isRecord(data) || !Array.isArray(data.conversations)) throw new ApiError(502, undefined, "invalid_conversation_response");
    return { conversations: data.conversations.map(parseConversation), next_cursor: nullableString(data.next_cursor) };
  });
}

export function listMessages(conversationId: string, cursor?: string): Promise<MessageListResponse> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest(`/api/v1/conversations/${encodeURIComponent(conversationId)}/messages${query}`).then((data) => {
    if (!isRecord(data) || !Array.isArray(data.messages)) throw new ApiError(502, undefined, "invalid_message_response");
    return { messages: data.messages.map(parseMessage), next_cursor: nullableString(data.next_cursor) };
  });
}

function sendMessagePayload(input: string | SendMessageInput): Record<string, unknown> {
  if (typeof input === "string") return { body: input };
  const payload: Record<string, unknown> = {};
  const body = input.body?.trim();
  if (body) payload.body = body;
  if (input.attachment_uploads && input.attachment_uploads.length > 0) {
    payload.attachment_uploads = input.attachment_uploads.map((upload) => ({
      signed_id: upload.signed_id,
      media_kind: upload.media_kind,
      ...(upload.poster_signed_id ? { poster_signed_id: upload.poster_signed_id } : {}),
    }));
  }
  if (input.reply_to_message_id) payload.reply_to_message_id = input.reply_to_message_id;
  return payload;
}

export function sendMessage(conversationId: string, input: string | SendMessageInput): Promise<Message> {
  return apiRequest(`/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sendMessagePayload(input)),
  }).then((data) => {
    if (!isRecord(data)) throw new ApiError(502, undefined, "invalid_message_response");
    return parseMessage(data.message);
  });
}
