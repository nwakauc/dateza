import { describe, expect, it } from "vitest";
import { liveSyncBackoffMs, LIVE_SYNC_NOTIFICATION_MS } from "./liveSyncTiming.ts";

describe("live-sync backoff", () => {
  it("keeps the base interval until a failure, then backs off without going sub-second", () => {
    expect(liveSyncBackoffMs(LIVE_SYNC_NOTIFICATION_MS, 0)).toBe(4_000);
    expect(liveSyncBackoffMs(LIVE_SYNC_NOTIFICATION_MS, 1)).toBe(8_000);
    expect(liveSyncBackoffMs(LIVE_SYNC_NOTIFICATION_MS, 8)).toBe(30_000);
    expect(liveSyncBackoffMs(2_000, 0)).toBe(2_000);
  });
});
