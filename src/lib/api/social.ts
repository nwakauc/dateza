import { apiRequest } from "./client.ts";
import { ApiError } from "./errors.ts";
import { parseCompatibility, parsePublicProfile } from "./find.ts";
import type {
  Conversation,
  ConversationListResponse,
  LikeListItem,
  LikeListResponse,
  MatchListResponse,
  Message,
  MessageListResponse,
} from "./socialTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function nullableString(value: unknown): string | null { return typeof value === "string" ? value : null; }

export function parseMessage(value: unknown): Message {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.conversation_id !== "string" || typeof value.sender_id !== "string" || typeof value.body !== "string" || typeof value.created_at !== "string") throw new ApiError(502, undefined, "invalid_message_response");
  return { id: value.id, conversation_id: value.conversation_id, sender_id: value.sender_id, body: value.body, created_at: value.created_at };
}

export function parseConversation(value: unknown): Conversation {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.match_id !== "string" || (value.status !== "active" && value.status !== "closed") || typeof value.created_at !== "string") throw new ApiError(502, undefined, "invalid_conversation_response");
  let lastMessage = null;
  if (isRecord(value.last_message) && typeof value.last_message.id === "string" && typeof value.last_message.body === "string" && typeof value.last_message.created_at === "string") {
    lastMessage = { id: value.last_message.id, sender_id: nullableString(value.last_message.sender_id), body: value.last_message.body, created_at: value.last_message.created_at };
  }
  return { id: value.id, match_id: value.match_id, status: value.status, created_at: value.created_at, profile: parsePublicProfile(value.profile), last_message: lastMessage };
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

export function sendMessage(conversationId: string, body: string): Promise<Message> {
  return apiRequest(`/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) }).then((data) => {
    if (!isRecord(data)) throw new ApiError(502, undefined, "invalid_message_response");
    return parseMessage(data.message);
  });
}
