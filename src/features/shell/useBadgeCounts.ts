/**
 * DateZA has no "likes received" or "unread messages" endpoints yet (see
 * src/features/likes/LikesPage.tsx and src/features/chats/ChatsPage.tsx —
 * both are honest placeholders until those backend contracts exist). The
 * nav is already wired to render real counts the moment this returns them;
 * until then it stays at zero rather than guessing.
 */
export function useBadgeCounts(): { likes: number; chats: number } {
  return { likes: 0, chats: 0 };
}
