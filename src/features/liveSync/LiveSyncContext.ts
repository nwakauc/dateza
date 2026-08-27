import { createContext, useContext } from "react";
import type { ReceivedOpener } from "../../lib/api/openerTypes.ts";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import type { Conversation, Match, Message } from "../../lib/api/socialTypes.ts";

export type LiveInbox = {
  notifications: ProductNotification[];
  unreadCount: number;
  revision: number;
};

export type ChatsLiveSnapshot = {
  conversations: Conversation[];
  openers?: ReceivedOpener[];
  openersError: boolean;
  matches?: Match[];
};

export type LiveSyncValue = {
  inbox: LiveInbox | null;
  refreshNow: () => Promise<void>;
  subscribeChatsInbox: (handler: (snapshot: ChatsLiveSnapshot) => void) => () => void;
  setActiveConversation: (id: string | null) => void;
  subscribeMessages: (handler: (conversationId: string, messages: Message[]) => void) => () => void;
};

export const LiveSyncContext = createContext<LiveSyncValue | null>(null);

export function useLiveSync(): LiveSyncValue | null {
  return useContext(LiveSyncContext);
}
