/**
 * D8N exposes Matches and Conversations, but not likes-received counts or
 * conversation read state. Keep those two primary-nav badges at zero rather
 * than deriving misleading counts from different concepts.
 */
export function useBadgeCounts(): { likes: number; chats: number } {
  return { likes: 0, chats: 0 };
}
