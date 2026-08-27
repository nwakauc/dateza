import { parseDatingEventPayload } from "../../lib/api/notifications.ts";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";

/**
 * Maps a product notification to a DateZA route. Backend returns public
 * UUIDs and target types, never frontend paths.
 */
export function resolveNotificationDestination(notification: ProductNotification): string | null {
  const payload = parseDatingEventPayload(notification.payload);
  if (!payload) return null;
  switch (payload.target.type) {
    case "profile":
      return `/profile/${payload.target.id}`;
    case "match":
      return `/profile/${payload.actor.profile_id}`;
    case "opener":
      return "/chats";
    case "conversation":
      return `/chats?conversation=${encodeURIComponent(payload.target.id)}`;
  }
}
