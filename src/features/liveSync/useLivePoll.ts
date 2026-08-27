import { useEffect, useRef } from "react";
import { liveSyncBackoffMs } from "./liveSyncTiming.ts";

/**
 * One timeout chain per concern. Pauses while hidden, ticks immediately on
 * visible, backs off after failures, and never overlaps in-flight work.
 */
export function useLivePoll(enabled: boolean, intervalMs: number, tick: () => Promise<void>): void {
  const tickRef = useRef(tick);
  const failuresRef = useRef(0);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer = 0;
    let inFlight = false;

    async function run() {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        await tickRef.current();
        if (!cancelled) failuresRef.current = 0;
      } catch {
        if (!cancelled) failuresRef.current += 1;
      } finally {
        inFlight = false;
      }
    }

    function schedule() {
      window.clearTimeout(timer);
      if (cancelled || document.visibilityState === "hidden") return;
      timer = window.setTimeout(() => {
        void (async () => {
          if (cancelled || document.visibilityState === "hidden") return;
          await run();
          if (!cancelled) schedule();
        })();
      }, liveSyncBackoffMs(intervalMs, failuresRef.current));
    }

    if (document.visibilityState !== "hidden") {
      void run().then(() => {
        if (!cancelled) schedule();
      });
    }

    function onVisibility() {
      if (cancelled) return;
      window.clearTimeout(timer);
      if (document.visibilityState !== "visible") return;
      void run().then(() => {
        if (!cancelled) schedule();
      });
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs]);
}
