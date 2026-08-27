import { apiRequest } from "./client.ts";
import { ApiError } from "./errors.ts";
import type {
  DatingEventNotificationPayload,
  NotificationListResponse,
  NotificationPreferences,
  NotificationPreferencesUpdate,
  NotificationTargetType,
  ProductNotification,
} from "./notificationTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const TARGET_TYPES = new Set<NotificationTargetType>(["profile", "match", "opener", "conversation"]);

export function parseDatingEventPayload(payload: Record<string, unknown>): DatingEventNotificationPayload | null {
  if (!isRecord(payload.actor) || typeof payload.actor.profile_id !== "string" || !payload.actor.profile_id) {
    return null;
  }
  if (!isRecord(payload.target) || typeof payload.target.id !== "string" || !payload.target.id) {
    return null;
  }
  const type = payload.target.type;
  if (typeof type !== "string" || !TARGET_TYPES.has(type as NotificationTargetType)) {
    return null;
  }
  return {
    actor: { profile_id: payload.actor.profile_id },
    target: { type: type as NotificationTargetType, id: payload.target.id },
  };
}

function parseNotification(value: unknown): ProductNotification {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.type !== "string" ||
      typeof value.title !== "string" || typeof value.body !== "string" || !isRecord(value.payload) ||
      typeof value.created_at !== "string") {
    throw new ApiError(502, undefined, "invalid_notification_response");
  }
  return {
    id: value.id,
    type: value.type,
    title: value.title,
    body: value.body,
    payload: value.payload,
    read_at: typeof value.read_at === "string" ? value.read_at : null,
    created_at: value.created_at,
  };
}

export function listNotifications(): Promise<NotificationListResponse> {
  return apiRequest("/api/v1/notifications").then((data) => {
    if (!isRecord(data) || !Array.isArray(data.notifications) || typeof data.unread_count !== "number") {
      throw new ApiError(502, undefined, "invalid_notification_response");
    }
    return { notifications: data.notifications.map(parseNotification), unread_count: data.unread_count };
  });
}

export function markNotificationRead(id: string): Promise<ProductNotification> {
  return apiRequest(`/api/v1/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" }).then((data) => {
    if (!isRecord(data)) throw new ApiError(502, undefined, "invalid_notification_response");
    return parseNotification(data.notification);
  });
}

export function markAllNotificationsRead(): Promise<void> {
  return apiRequest("/api/v1/notifications/read_all", { method: "POST" }).then(() => undefined);
}

function parsePreferences(value: unknown): NotificationPreferences {
  if (!isRecord(value) || typeof value.product_email_enabled !== "boolean" || typeof value.push_enabled !== "boolean") {
    throw new ApiError(502, undefined, "invalid_notification_preferences");
  }
  return {
    product_email_enabled: value.product_email_enabled,
    push_enabled: value.push_enabled,
  };
}

function unwrapPreferences(data: unknown): NotificationPreferences {
  if (!isRecord(data) || !isRecord(data.preferences)) {
    throw new ApiError(502, undefined, "invalid_notification_preferences");
  }
  return parsePreferences(data.preferences);
}

/** GET /api/v1/notifications/preferences — effective defaults if no row exists. */
export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiRequest("/api/v1/notifications/preferences").then(unwrapPreferences);
}

/** PATCH /api/v1/notifications/preferences — partial JSON boolean updates. */
export function updateNotificationPreferences(update: NotificationPreferencesUpdate): Promise<NotificationPreferences> {
  return apiRequest("/api/v1/notifications/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  }).then(unwrapPreferences);
}
