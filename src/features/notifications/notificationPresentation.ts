import { parseDatingEventPayload } from "../../lib/api/notifications.ts";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";

export type NotificationFilter = "all" | "likes" | "matches" | "messages" | "activity";

export type NotificationKind = "like" | "match" | "message" | "opener" | "welcome" | "activity";

export type NotificationActor = {
  displayName: string | null;
  age: number | null;
  city: string | null;
  photoUrl: string | null;
};

export const NOTIFICATION_FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "likes", label: "Likes" },
  { id: "matches", label: "Matches" },
  { id: "messages", label: "Messages" },
  { id: "activity", label: "Activity" },
];

export function notificationKind(type: string): NotificationKind {
  switch (type) {
    case "dateza.like_received":
      return "like";
    case "dateza.match_created":
      return "match";
    case "dateza.message_received":
      return "message";
    case "dateza.opener_received":
      return "opener";
    case "dateza.welcome":
      return "welcome";
    default:
      return "activity";
  }
}

export function notificationFilterFor(type: string): Exclude<NotificationFilter, "all"> {
  const kind = notificationKind(type);
  if (kind === "like") return "likes";
  if (kind === "match") return "matches";
  if (kind === "message" || kind === "opener") return "messages";
  return "activity";
}

export function matchesNotificationFilter(item: ProductNotification, filter: NotificationFilter): boolean {
  return filter === "all" || notificationFilterFor(item.type) === filter;
}

export function actorProfileIds(items: ProductNotification[]): string[] {
  const ids = new Set<string>();
  for (const item of items) {
    const payload = parseDatingEventPayload(item.payload);
    if (payload) ids.add(payload.actor.profile_id);
  }
  return [...ids];
}

export function actorFromProfile(profile: {
  display_name: string | null;
  age: number | null;
  city: string | null;
  photos: { primary: boolean; url: string }[];
}): NotificationActor {
  const photo = profile.photos.find((entry) => entry.primary) ?? profile.photos[0];
  return {
    displayName: profile.display_name,
    age: profile.age,
    city: profile.city,
    photoUrl: photo?.url ?? null,
  };
}

export function compactRelativeTime(value: string, now = Date.now()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const seconds = Math.round((now - date.getTime()) / 1000);
  if (seconds < 45) return "now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function identityLine(actor: NotificationActor): string | null {
  if (!actor.displayName) return null;
  const parts = [actor.displayName];
  if (actor.age != null) parts.push(String(actor.age));
  if (actor.city) parts.push(actor.city);
  return parts.join(", ");
}

export type NotificationCopy = {
  title: string;
  subtitle: string;
};

/** Member-facing copy. Names come from owner-scoped profile detail, never from
 * the notification payload (D8N does not embed them). Message bodies stay the
 * server title/body until D8N ships a snippet field. */
export function notificationCopy(
  item: ProductNotification,
  actor: NotificationActor | undefined,
): NotificationCopy {
  const name = actor?.displayName?.trim() || null;
  const kind = notificationKind(item.type);
  if (name && actor) {
    if (kind === "like") {
      return { title: `${name} liked your profile`, subtitle: identityLine(actor) ?? item.body };
    }
    if (kind === "match") {
      return { title: item.title, subtitle: `You and ${name} like each other` };
    }
    if (kind === "message") {
      return { title: `${name} sent you a message`, subtitle: item.body };
    }
    if (kind === "opener") {
      return { title: `${name} sent you an opener`, subtitle: item.body };
    }
  }
  return { title: item.title, subtitle: item.body };
}

export function unreadCountForFilter(items: ProductNotification[], filter: NotificationFilter): number {
  return items.filter((item) => item.read_at === null && matchesNotificationFilter(item, filter)).length;
}

export function countPhrase(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
