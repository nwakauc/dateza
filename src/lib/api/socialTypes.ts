import type { PublicProfile } from "./findTypes.ts";

export type Match = { id: string; matched_at: string; profile: PublicProfile };
export type MatchListResponse = { matches: Match[]; next_cursor: string | null };
export type MessagePreview = { id: string; sender_id: string | null; body: string; created_at: string };
export type Conversation = { id: string; match_id: string; status: "active" | "closed"; created_at: string; profile: PublicProfile; last_message: MessagePreview | null };
export type ConversationListResponse = { conversations: Conversation[]; next_cursor: string | null };
export type Message = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };
export type MessageListResponse = { messages: Message[]; next_cursor: string | null };
