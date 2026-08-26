import { apiRequest } from "./client.ts";
import { ApiError } from "./errors.ts";
import type { NotificationListResponse, ProductNotification } from "./notificationTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
