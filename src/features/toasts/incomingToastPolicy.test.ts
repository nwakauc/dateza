import { describe, expect, it } from "vitest";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import { selectIncomingNotificationToasts, shouldToastIncomingNotification } from "./incomingToastPolicy.ts";

function notice(overrides: Partial<ProductNotification> = {}): ProductNotification {
  return {
    id: "n-new",
    type: "dateza.like_received",
    title: "Someone likes you",
    body: "You have a new like on DateZA.",
    payload: { actor: { profile_id: "p1" }, target: { type: "profile", id: "owner" } },
    read_at: null,
    created_at: "2026-08-27T12:00:00Z",
    ...overrides,
  };
}

describe("incoming toast policy", () => {
  it("toasts new unread likes, matches, messages, and openers after the first snapshot", () => {
    const seen = new Set(["n-old"]);
    const location = { pathname: "/discover", search: "" };
    expect(shouldToastIncomingNotification(notice(), seen, location)).toBe(true);
    expect(shouldToastIncomingNotification(notice({ type: "dateza.match_created" }), seen, location)).toBe(true);
    expect(
      shouldToastIncomingNotification(
        notice({
          type: "dateza.message_received",
          payload: { actor: { profile_id: "p1" }, target: { type: "conversation", id: "c1" } },
        }),
        seen,
        location,
      ),
    ).toBe(true);
    expect(shouldToastIncomingNotification(notice({ type: "dateza.opener_received" }), seen, location)).toBe(true);
  });

  it("does not toast historical, read, welcome, or invented profile-view events", () => {
    const seen = new Set(["n-old"]);
    const location = { pathname: "/discover", search: "" };
    expect(shouldToastIncomingNotification(notice({ id: "n-old" }), seen, location)).toBe(false);
    expect(shouldToastIncomingNotification(notice({ read_at: "2026-08-27T12:01:00Z" }), seen, location)).toBe(false);
    expect(shouldToastIncomingNotification(notice({ type: "dateza.welcome" }), seen, location)).toBe(false);
    expect(shouldToastIncomingNotification(notice({ type: "dateza.profile_viewed" }), seen, location)).toBe(false);
  });

  it("does not toast while the inbox is open, or a message for the conversation already on screen", () => {
    const seen = new Set<string>();
    expect(shouldToastIncomingNotification(notice(), seen, { pathname: "/notifications", search: "" })).toBe(false);
    expect(
      shouldToastIncomingNotification(
        notice({
          type: "dateza.message_received",
          payload: { actor: { profile_id: "p1" }, target: { type: "conversation", id: "c1" } },
        }),
        seen,
        { pathname: "/chats", search: "?conversation=c1" },
      ),
    ).toBe(false);
    expect(
      shouldToastIncomingNotification(
        notice({
          type: "dateza.message_received",
          payload: { actor: { profile_id: "p1" }, target: { type: "conversation", id: "c1" } },
        }),
        seen,
        { pathname: "/chats", search: "?conversation=c2" },
      ),
    ).toBe(true);
  });

  it("returns only the fresh toastable rows from a poll", () => {
    const selected = selectIncomingNotificationToasts(
      [
        notice({ id: "n-old" }),
        notice({ id: "n-like" }),
        notice({ id: "n-view", type: "dateza.profile_viewed" }),
      ],
      new Set(["n-old"]),
      { pathname: "/find", search: "" },
    );
    expect(selected.map((item) => item.id)).toEqual(["n-like"]);
  });
});
