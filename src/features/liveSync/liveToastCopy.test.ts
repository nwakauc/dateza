import { describe, expect, it } from "vitest";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import { liveToastCopy, liveToastHref } from "./liveToastCopy.ts";

function notice(overrides: Partial<ProductNotification> = {}): ProductNotification {
  return {
    id: "n1",
    type: "dateza.like_received",
    title: "Someone likes you",
    body: "You have a new like on DateZA.",
    payload: { actor: { profile_id: "p1" }, target: { type: "profile", id: "owner" } },
    read_at: null,
    created_at: "2026-08-27T12:00:00Z",
    ...overrides,
  };
}

const actor = { displayName: "Inga", age: 28, city: "Cape Town", photoUrl: "https://example.test/inga.jpg" };

describe("live toast copy", () => {
  it("uses server targets for chat, likes hub for likes, and match profile for matches", () => {
    expect(liveToastHref(notice())).toBe("/likes?tab=liked_you");
    expect(
      liveToastHref(
        notice({
          type: "dateza.message_received",
          payload: { actor: { profile_id: "p1" }, target: { type: "conversation", id: "c1" } },
        }),
      ),
    ).toBe("/chats?conversation=c1");
    expect(
      liveToastHref(
        notice({
          type: "dateza.match_created",
          payload: { actor: { profile_id: "p1" }, target: { type: "match", id: "m1" } },
        }),
      ),
    ).toBe("/profile/p1");
    expect(
      liveToastHref(
        notice({
          type: "dateza.opener_received",
          payload: { actor: { profile_id: "p1" }, target: { type: "opener", id: "o1" } },
        }),
      ),
    ).toBe("/chats");
  });

  it("writes action copy for likes, matches, messages, and openers", () => {
    expect(liveToastCopy(notice(), actor)).toEqual({
      title: "Inga liked you",
      subtitle: "See who",
      href: "/likes?tab=liked_you",
    });
    expect(liveToastCopy(notice({ type: "dateza.match_created" }), actor).title).toBe("It’s a match!");
    expect(liveToastCopy(notice({ type: "dateza.match_created" }), actor).subtitle).toBe("Say hello");
    expect(
      liveToastCopy(
        notice({
          type: "dateza.message_received",
          payload: { actor: { profile_id: "p1" }, target: { type: "conversation", id: "c1" } },
        }),
        actor,
      ),
    ).toMatchObject({ title: "Inga sent you a message", subtitle: "View chat", href: "/chats?conversation=c1" });
    expect(
      liveToastCopy(
        notice({
          type: "dateza.opener_received",
          payload: { actor: { profile_id: "p1" }, target: { type: "opener", id: "o1" } },
        }),
        { ...actor, displayName: "Mason" },
      ),
    ).toMatchObject({ title: "Mason sent you an opener", subtitle: "View", href: "/chats" });
  });
});
