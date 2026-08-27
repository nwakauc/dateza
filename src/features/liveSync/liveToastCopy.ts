import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import { resolveNotificationDestination } from "../notifications/notificationDestination.ts";
import { notificationKind, type NotificationActor } from "../notifications/notificationPresentation.ts";

export type LiveToastCopy = {
  title: string;
  subtitle: string;
  href: string;
};

export function liveToastCopy(item: ProductNotification, actor: NotificationActor | undefined): LiveToastCopy {
  const kind = notificationKind(item.type);
  const name = actor?.displayName?.trim() || null;
  const destination = liveToastHref(item);

  if (kind === "like") {
    return { title: name ? `${name} liked you` : "Someone liked you", subtitle: "See who", href: destination };
  }
  if (kind === "match") {
    return { title: "It’s a match!", subtitle: "Say hello", href: destination };
  }
  if (kind === "message") {
    return { title: name ? `${name} sent you a message` : "You have a new message", subtitle: "View chat", href: destination };
  }
  if (kind === "opener") {
    return { title: name ? `${name} sent you an opener` : "You have a new opener", subtitle: "View", href: destination };
  }
  return { title: item.title, subtitle: item.body, href: destination };
}

/**
 * Navigate from server targets. Likes open the Likes hub because the payload
 * target is often the owner's own profile, not the person who liked them.
 */
export function liveToastHref(item: ProductNotification): string {
  const kind = notificationKind(item.type);
  if (kind === "like") return "/likes?tab=liked_you";
  const dest = resolveNotificationDestination(item);
  if (dest) return dest;
  if (kind === "match") return "/likes?tab=mutual";
  if (kind === "opener" || kind === "message") return "/chats";
  return "/notifications";
}
