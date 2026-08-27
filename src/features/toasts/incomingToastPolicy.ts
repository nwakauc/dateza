import { parseDatingEventPayload } from "../../lib/api/notifications.ts";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";

/** D8N dating events that may surface as live toasts. Profile views are not a DateZA notification type. */
export const TOASTABLE_NOTIFICATION_TYPES = new Set([
  "dateza.like_received",
  "dateza.match_created",
  "dateza.message_received",
  "dateza.opener_received",
]);

export function conversationIdFromLocation(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const id = params.get("conversation");
  return id && id.length > 0 ? id : null;
}

export function shouldToastIncomingNotification(
  item: ProductNotification,
  previousIds: ReadonlySet<string>,
  location: { pathname: string; search: string },
): boolean {
  if (previousIds.has(item.id) || item.read_at) return false;
  if (!TOASTABLE_NOTIFICATION_TYPES.has(item.type)) return false;
  if (location.pathname === "/notifications") return false;
  if (item.type === "dateza.message_received") {
    const payload = parseDatingEventPayload(item.payload);
    const openId = conversationIdFromLocation(location.search);
    if (payload?.target.type === "conversation" && openId && payload.target.id === openId) return false;
  }
  return true;
}

/** Sound may play for a live event even when the toast is suppressed in the open chat. */
export function shouldPlayIncomingSound(item: ProductNotification, previousIds: ReadonlySet<string>): boolean {
  if (previousIds.has(item.id)) return false;
  return TOASTABLE_NOTIFICATION_TYPES.has(item.type);
}

export function selectIncomingNotificationToasts(
  incoming: ProductNotification[],
  previousIds: ReadonlySet<string>,
  location: { pathname: string; search: string },
): ProductNotification[] {
  return incoming.filter((item) => shouldToastIncomingNotification(item, previousIds, location));
}
