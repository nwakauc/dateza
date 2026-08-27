import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getProfileDetail } from "../../lib/api/find.ts";
import { listNotifications, parseDatingEventPayload } from "../../lib/api/notifications.ts";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import { actorFromProfile, notificationCopy, notificationKind } from "../notifications/notificationPresentation.ts";
import { resolveNotificationDestination } from "../notifications/notificationDestination.ts";
import { useToast } from "./useToast.ts";
import { selectIncomingNotificationToasts } from "./incomingToastPolicy.ts";
import type { ToastTone } from "./toastTypes.ts";

const POLL_MS = 25_000;

function toneForNotification(type: string): ToastTone {
  const kind = notificationKind(type);
  if (kind === "like" || kind === "match" || kind === "message" || kind === "opener") return kind;
  return "success";
}

type Props = {
  onUnreadCount: (count: number) => void;
  refreshKey: number;
};

export function IncomingEventToasts({ onUnreadCount, refreshKey }: Props) {
  const location = useLocation();
  const toast = useToast();
  const seenRef = useRef<Set<string> | null>(null);
  const locationRef = useRef(location);
  const toastRef = useRef(toast);
  const unreadRef = useRef(onUnreadCount);

  useEffect(() => {
    locationRef.current = location;
    toastRef.current = toast;
    unreadRef.current = onUnreadCount;
  }, [location, onUnreadCount, toast]);

  useEffect(() => {
    let cancelled = false;

    async function present(items: ProductNotification[]) {
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
          if (cancelled) return;
          const copy = notificationCopy(item, actor);
          toastRef.current.show({
            tone: toneForNotification(item.type),
            title: copy.title,
            subtitle: copy.subtitle,
            href: resolveNotificationDestination(item) ?? "/notifications",
            photoUrl: actor?.photoUrl,
            notificationId: item.id,
          });
        }),
      );
    }

    async function tick() {
      try {
        const result = await listNotifications();
        if (cancelled) return;
        unreadRef.current(result.unread_count);
        const seen = seenRef.current;
        if (seen == null) {
          seenRef.current = new Set(result.notifications.map((item) => item.id));
          return;
        }
        const fresh = selectIncomingNotificationToasts(result.notifications, seen, locationRef.current);
        for (const item of result.notifications) seen.add(item.id);
        if (fresh.length > 0) await present(fresh);
      } catch {
        /* keep the last unread count */
      }
    }

    void tick();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void tick();
    }, POLL_MS);

    function onVisibility() {
      if (document.visibilityState === "visible") void tick();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshKey]);

  return null;
}
