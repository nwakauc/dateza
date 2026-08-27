import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLivePoll } from "./useLivePoll.ts";

function Probe({ enabled, intervalMs, tick }: { enabled: boolean; intervalMs: number; tick: () => Promise<void> }) {
  useLivePoll(enabled, intervalMs, tick);
  return null;
}

describe("useLivePoll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
  });

  it("ticks immediately, then on the interval, and stops after unmount", async () => {
    const tick = vi.fn(async () => undefined);
    const view = render(<Probe enabled intervalMs={2_000} tick={tick} />);
    await vi.advanceTimersByTimeAsync(0);
    expect(tick).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(tick).toHaveBeenCalledTimes(2);
    view.unmount();
    await vi.advanceTimersByTimeAsync(8_000);
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it("pauses while hidden and ticks immediately when the tab is visible again", async () => {
    let hidden = false;
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
    const tick = vi.fn(async () => undefined);
    render(<Probe enabled intervalMs={2_000} tick={tick} />);
    await vi.advanceTimersByTimeAsync(0);
    expect(tick).toHaveBeenCalledTimes(1);
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(6_000);
    expect(tick).toHaveBeenCalledTimes(1);
    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(tick).toHaveBeenCalledTimes(2);
  });

  it("keeps polling after a failure and does not overlap in-flight ticks", async () => {
    let resolveTick: () => void = () => undefined;
    const tick = vi.fn(() => new Promise<void>((resolve) => {
      resolveTick = resolve;
    }));
    render(<Probe enabled intervalMs={1_000} tick={tick} />);
    await vi.advanceTimersByTimeAsync(0);
    expect(tick).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(tick).toHaveBeenCalledTimes(1);
    resolveTick();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(tick).toHaveBeenCalledTimes(2);
  });
});
