import { apiRequest } from "./client.ts";
import { ApiError } from "./errors.ts";
import { parsePublicProfile } from "./find.ts";
import type { Conversation, ConversationListResponse, MatchListResponse, Message, MessageListResponse } from "./socialTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function nullableString(value: unknown): string | null { return typeof value === "string" ? value : null; }

function parseMessage(value: unknown): Message {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.conversation_id !== "string" || typeof value.sender_id !== "string" || typeof value.body !== "string" || typeof value.created_at !== "string") throw new ApiError(502, undefined, "invalid_message_response");
  return { id: value.id, conversation_id: value.conversation_id, sender_id: value.sender_id, body: value.body, created_at: value.created_at };
}

function parseConversation(value: unknown): Conversation {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.match_id !== "string" || (value.status !== "active" && value.status !== "closed") || typeof value.created_at !== "string") throw new ApiError(502, undefined, "invalid_conversation_response");
  let lastMessage = null;
  if (isRecord(value.last_message) && typeof value.last_message.id === "string" && typeof value.last_message.body === "string" && typeof value.last_message.created_at === "string") {
    lastMessage = { id: value.last_message.id, sender_id: nullableString(value.last_message.sender_id), body: value.last_message.body, created_at: value.last_message.created_at };
  }
  return { id: value.id, match_id: value.match_id, status: value.status, created_at: value.created_at, profile: parsePublicProfile(value.profile), last_message: lastMessage };
}

export function listMatches(): Promise<MatchListResponse> {
  return apiRequest("/api/v1/matches").then((data) => {
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

export function listConversations(): Promise<ConversationListResponse> {
  return apiRequest("/api/v1/conversations").then((data) => {
    if (!isRecord(data) || !Array.isArray(data.conversations)) throw new ApiError(502, undefined, "invalid_conversation_response");
    return { conversations: data.conversations.map(parseConversation), next_cursor: nullableString(data.next_cursor) };
  });
}

export function listMessages(conversationId: string): Promise<MessageListResponse> {
  return apiRequest(`/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`).then((data) => {
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
