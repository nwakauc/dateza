import type { MessageAttachment } from "./chatMediaTypes.ts";
import type { DatezaCompatibility, PublicProfile } from "./findTypes.ts";

export type Match = { id: string; matched_at: string; profile: PublicProfile };
export type MatchListResponse = { matches: Match[]; next_cursor: string | null };

/**
 * Incoming/outgoing like list entry. `compatibility` follows the shared
 * profile serializer: omitted or null are both valid and must not be treated
 * as errors.
 */
export type LikeProfile = PublicProfile & {
  compatibility: DatezaCompatibility;
};

export type LikeListItem = {
  liked_at: string;
  profile: LikeProfile;
};

export type LikeListResponse = {
  likes: LikeListItem[];
  next_cursor: string | null;
};
export type MessagePreview = {
  id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
  attachments: MessageAttachment[];
};
export type ConversationRelationshipState = "active" | "ended";
export type Conversation = {
  id: string;
  match_id: string;
  status: "active" | "closed";
  /** Match lifecycle from D8N. Independent of `status`; unmatch ends the match without closing the conversation row. */
  relationship_state: ConversationRelationshipState;
  created_at: string;
  profile: PublicProfile;
  last_message: MessagePreview | null;
};
export type ConversationListResponse = { conversations: Conversation[]; next_cursor: string | null };
export type MessageReplyTo = {
  id: string;
  sender_id: string;
  message_type: "text" | "media";
  body_excerpt: string | null;
  deleted: boolean;
};
export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  attachments: MessageAttachment[];
  reply_to: MessageReplyTo | null;
};
export type MessageListResponse = { messages: Message[]; next_cursor: string | null };
