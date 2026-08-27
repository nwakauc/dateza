import type { Conversation, Message, MessagePreview } from "../../lib/api/socialTypes.ts";

const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

export function messageTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : timeFormatter.format(date);
}

export function conversationTime(value: string, now = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (date.toDateString() === now.toDateString()) return timeFormatter.format(date);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return shortDateFormatter.format(date);
}

export function matchDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : shortDateFormatter.format(date);
}

export function conversationCanCompose(conversation: Pick<Conversation, "status" | "relationship_state">): boolean {
  return conversation.status === "active" && conversation.relationship_state !== "ended";
}

export function conversationIsEnded(conversation: Pick<Conversation, "relationship_state">): boolean {
  return conversation.relationship_state === "ended";
}

export function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}

export function upsertConversation(conversations: Conversation[], conversation: Conversation): Conversation[] {
  return [conversation, ...conversations.filter((item) => item.id !== conversation.id)];
}

/** Reply create path omits `last_message`; use the companion message from the same response. */
export function conversationWithPreview(conversation: Conversation, message: Message): Conversation {
  if (conversation.last_message) return conversation;
  return {
    ...conversation,
    last_message: {
      id: message.id,
      sender_id: message.sender_id,
      body: message.body,
      created_at: message.created_at,
      attachments: message.attachments,
    },
  };
}

export function replaceConversationPreview(
  conversations: Conversation[],
  conversationId: string,
  message: Message,
): Conversation[] {
  return conversations.map((conversation) =>
    conversation.id === conversationId
      ? {
          ...conversation,
          last_message: {
            id: message.id,
            sender_id: message.sender_id,
            body: message.body,
            created_at: message.created_at,
            attachments: message.attachments,
          },
        }
      : conversation,
  );
}

export function conversationPreviewLabel(preview: MessagePreview | null): string {
  if (!preview) return "Start the conversation";
  const text = preview.body.trim();
  if (text) return text;
  const kinds = preview.attachments.filter((item) => !item.deleted).map((item) => item.media_kind);
  if (kinds.includes("video") && kinds.includes("image")) return "Photo and video";
  if (kinds.includes("video")) return "Video";
  if (kinds.includes("image")) return "Photo";
  return "Photo or video";
}

export function messageHasContent(message: Pick<Message, "body" | "attachments">): boolean {
  return message.body.trim().length > 0 || message.attachments.some((item) => !item.deleted);
}
