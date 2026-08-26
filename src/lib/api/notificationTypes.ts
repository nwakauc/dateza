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
