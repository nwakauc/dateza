import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { getProfileDetail } from "../../lib/api/find.ts";
import { listNotifications, markNotificationRead, parseDatingEventPayload } from "../../lib/api/notifications.ts";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import { listReceivedOpeners } from "../../lib/api/opener.ts";
import { listConversations, listMatches, listMessages } from "../../lib/api/social.ts";
import type { Message } from "../../lib/api/socialTypes.ts";
import {
  actorFromProfile,
  countUnreadChatNotifications,
  notificationKind,
  unreadChatNotificationsForConversation,
} from "../notifications/notificationPresentation.ts";
import { selectIncomingNotificationToasts, shouldPlayIncomingSound } from "../toasts/incomingToastPolicy.ts";
import type { ToastTone } from "../toasts/toastTypes.ts";
import { useToast } from "../toasts/useToast.ts";
import { playInAppSound, unlockInAppAudio } from "./inAppSound.ts";
import { LIVE_SYNC_INBOX_MS, LIVE_SYNC_MESSAGE_MS, LIVE_SYNC_NOTIFICATION_MS } from "./liveSyncTiming.ts";
import { liveToastCopy } from "./liveToastCopy.ts";
import { LiveSyncContext, type ChatsLiveSnapshot, type LiveInbox, type LiveSyncValue } from "./LiveSyncContext.ts";
import { useLivePoll } from "./useLivePoll.ts";

type Props = {
  onUnreadCount: (count: number) => void;
  onUnreadChats: (count: number) => void;
  refreshKey: number;
  children?: ReactNode;
};

function toneForNotification(type: string): ToastTone {
  const kind = notificationKind(type);
  if (kind === "like" || kind === "match" || kind === "message" || kind === "opener") return kind;
  return "success";
}

export function LiveSyncProvider({ onUnreadCount, onUnreadChats, refreshKey, children }: Props) {
  const location = useLocation();
  const toast = useToast();
  const [inbox, setInbox] = useState<LiveInbox | null>(null);
  const [chatsListening, setChatsListening] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const seenToastIds = useRef<Set<string> | null>(null);
  const seenSoundIds = useRef<Set<string> | null>(null);
  const locationRef = useRef(location);
  const toastRef = useRef(toast);
  const unreadRef = useRef(onUnreadCount);
  const chatsBadgeRef = useRef(onUnreadChats);
  const chatsHandlers = useRef(new Set<(snapshot: ChatsLiveSnapshot) => void>());
  const messageHandler = useRef<((conversationId: string, messages: Message[]) => void) | null>(null);
  const activeConversationRef = useRef<string | null>(null);
  const acknowledgingRef = useRef<Map<string, Promise<void>>>(new Map());
  const notifyTickRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    locationRef.current = location;
    toastRef.current = toast;
    unreadRef.current = onUnreadCount;
    chatsBadgeRef.current = onUnreadChats;
  }, [location, onUnreadChats, onUnreadCount, toast]);

  useEffect(() => {
    function unlock() {
      unlockInAppAudio();
    }
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const presentToasts = useCallback(async (items: ProductNotification[]) => {
    await Promise.all(
      items.map(async (item) => {
        const payload = parseDatingEventPayload(item.payload);
        let actor;
        if (payload) {
          try {
            const detail = await getProfileDetail(payload.actor.profile_id);
            actor = actorFromProfile(detail.profile);
          } catch {
            actor = undefined;
          }
        }
        const copy = liveToastCopy(item, actor);
        toastRef.current.show({
          tone: toneForNotification(item.type),
          title: copy.title,
          subtitle: copy.subtitle,
          href: copy.href,
          photoUrl: actor?.photoUrl,
          notificationId: item.id,
        });
      }),
    );
  }, []);

  const notifyTick = useCallback(async () => {
    const result = await listNotifications();
    unreadRef.current(result.unread_count);
    chatsBadgeRef.current(countUnreadChatNotifications(result.notifications));
    setInbox((current) => ({
      notifications: result.notifications,
      unreadCount: result.unread_count,
      revision: (current?.revision ?? 0) + 1,
    }));

    const toastSeen = seenToastIds.current;
    const soundSeen = seenSoundIds.current;
    if (toastSeen == null || soundSeen == null) {
      const ids = result.notifications.map((item) => item.id);
      seenToastIds.current = new Set(ids);
      seenSoundIds.current = new Set(ids);
      return;
    }

    const freshToasts = selectIncomingNotificationToasts(result.notifications, toastSeen, locationRef.current);
    const freshSounds = result.notifications.filter((item) => shouldPlayIncomingSound(item, soundSeen));
    for (const item of result.notifications) {
      toastSeen.add(item.id);
      soundSeen.add(item.id);
    }
    if (freshSounds.length > 0) void playInAppSound().catch(() => undefined);
    if (freshToasts.length > 0) await presentToasts(freshToasts);
  }, [presentToasts]);

  useEffect(() => {
    notifyTickRef.current = notifyTick;
  }, [notifyTick]);

  const chatsTick = useCallback(async () => {
    if (chatsHandlers.current.size === 0) return;
    const [conversationResult, openerResult, matchResult] = await Promise.allSettled([
      listConversations(),
      listReceivedOpeners(),
      listMatches(),
    ]);
    if (conversationResult.status === "rejected") throw conversationResult.reason;
    const snapshot: ChatsLiveSnapshot = {
      conversations: conversationResult.value.conversations,
      openers: openerResult.status === "fulfilled" ? openerResult.value.openers : undefined,
      openersError: openerResult.status === "rejected",
      matches: matchResult.status === "fulfilled" ? matchResult.value.matches : undefined,
    };
    chatsHandlers.current.forEach((handler) => handler(snapshot));
  }, []);

  const messagesTick = useCallback(async () => {
    const conversationId = activeConversationRef.current;
    const handler = messageHandler.current;
    if (!conversationId || !handler) return;
    const result = await listMessages(conversationId);
    if (activeConversationRef.current !== conversationId) return;
    handler(conversationId, result.messages);
  }, []);

  useLivePoll(true, LIVE_SYNC_NOTIFICATION_MS, notifyTick);
  useLivePoll(chatsListening, LIVE_SYNC_INBOX_MS, chatsTick);
  useLivePoll(Boolean(activeConversationId), LIVE_SYNC_MESSAGE_MS, messagesTick);

  useEffect(() => {
    if (refreshKey === 0) return;
    void notifyTickRef.current().catch(() => undefined);
  }, [refreshKey]);

  const refreshNow = useCallback(async () => {
    try {
      await notifyTickRef.current();
    } catch {
      /* keep last inbox */
    }
    if (chatsHandlers.current.size > 0) {
      try {
        await chatsTick();
      } catch {
        /* keep current chats */
      }
    }
    if (activeConversationRef.current && messageHandler.current) {
      try {
        await messagesTick();
      } catch {
        /* keep current thread */
      }
    }
  }, [chatsTick, messagesTick]);

  const subscribeChatsInbox = useCallback((handler: (snapshot: ChatsLiveSnapshot) => void) => {
    chatsHandlers.current.add(handler);
    setChatsListening(true);
    return () => {
      chatsHandlers.current.delete(handler);
      if (chatsHandlers.current.size === 0) setChatsListening(false);
    };
  }, []);

  const subscribeMessages = useCallback((handler: (conversationId: string, messages: Message[]) => void) => {
    messageHandler.current = handler;
    return () => {
      if (messageHandler.current === handler) messageHandler.current = null;
    };
  }, []);

  const setActiveConversation = useCallback((id: string | null) => {
    activeConversationRef.current = id;
    setActiveConversationId(id);
  }, []);

  const acknowledgeConversationRead = useCallback(async (conversationId: string) => {
    const inFlight = acknowledgingRef.current.get(conversationId);
    if (inFlight) return inFlight;

    const work = (async () => {
      try {
        const result = await listNotifications();
        const toMark = unreadChatNotificationsForConversation(result.notifications, conversationId);
        if (toMark.length === 0) return;
        await Promise.all(toMark.map((item) => markNotificationRead(item.id)));
        await notifyTickRef.current();
      } catch {
        /* keep badges until the next poll */
      } finally {
        acknowledgingRef.current.delete(conversationId);
      }
    })();

    acknowledgingRef.current.set(conversationId, work);
    return work;
  }, []);

  const value = useMemo<LiveSyncValue>(
    () => ({
      inbox,
      refreshNow,
      subscribeChatsInbox,
      setActiveConversation,
      acknowledgeConversationRead,
      subscribeMessages,
    }),
    [acknowledgeConversationRead, inbox, refreshNow, setActiveConversation, subscribeChatsInbox, subscribeMessages],
  );

  return <LiveSyncContext.Provider value={value}>{children}</LiveSyncContext.Provider>;
}
