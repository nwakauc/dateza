export type ToastTone = "success" | "error" | "like" | "match" | "message" | "opener";

export type ShowToastInput = {
  tone: ToastTone;
  title: string;
  subtitle?: string;
  href?: string;
  photoUrl?: string | null;
  notificationId?: string;
  durationMs?: number;
};

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  subtitle?: string;
  href?: string;
  photoUrl?: string;
  notificationId?: string;
  durationMs: number;
};

export type ToastApi = {
  show: (input: ShowToastInput) => string;
  dismiss: (id: string) => void;
  success: (title: string, subtitle?: string) => string;
  error: (title: string, subtitle?: string) => string;
};

export const TOAST_DURATION: Record<ToastTone, number> = {
  success: 4200,
  error: 7000,
  like: 6500,
  match: 8000,
  message: 6500,
  opener: 6500,
};

export const MAX_VISIBLE_TOASTS = 3;
