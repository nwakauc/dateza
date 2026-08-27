import { useOwnAccount } from "./useOwnAccount.ts";

/**
 * Likes-received counts are not on the D8N nav contract, so that badge stays
 * at zero. Chats uses unread message/opener notification rows — not invented
 * conversation read receipts, which D8N does not expose.
 */
export function useBadgeCounts(): { likes: number; chats: number } {
  const account = useOwnAccount();
  return { likes: 0, chats: account.unreadChats };
}
