export type NotificationTargetType = "profile" | "match" | "opener" | "conversation";

export type DatingEventNotificationPayload = {
  actor: { profile_id: string };
  target: { type: NotificationTargetType; id: string };
};

export type ProductNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type NotificationListResponse = {
  notifications: ProductNotification[];
  unread_count: number;
};

export type NotificationPreferences = {
  product_email_enabled: boolean;
  push_enabled: boolean;
};

export type NotificationPreferencesUpdate = {
  product_email_enabled?: boolean;
  push_enabled?: boolean;
};
