/** Controlled-beta polling. Not WebSockets. Pause while the tab is hidden. */
export const LIVE_SYNC_MESSAGE_MS = 2_000;
export const LIVE_SYNC_NOTIFICATION_MS = 4_000;
export const LIVE_SYNC_INBOX_MS = 4_000;
export const LIVE_SYNC_MAX_BACKOFF_MS = 30_000;

export function liveSyncBackoffMs(intervalMs: number, consecutiveFailures: number): number {
  if (consecutiveFailures <= 0) return intervalMs;
  return Math.min(LIVE_SYNC_MAX_BACKOFF_MS, intervalMs * 2 ** Math.min(consecutiveFailures, 4));
}
