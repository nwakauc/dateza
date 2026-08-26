import type { Conversation, Message } from "../../lib/api/socialTypes.ts";

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

export function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
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
          },
        }
      : conversation,
  );
}
