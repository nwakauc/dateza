import { describe, expect, it } from "vitest";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import {
  actorProfileIds,
  compactRelativeTime,
  countPhrase,
  countUnreadChatNotifications,
  matchesNotificationFilter,
  notificationCopy,
  notificationFilterFor,
  notificationKind,
  unreadChatNotificationsForConversation,
  unreadCountForFilter,
} from "./notificationPresentation.ts";

function notice(overrides: Partial<ProductNotification> = {}): ProductNotification {
  return {
    id: "n1",
    type: "dateza.welcome",
    title: "Welcome to DateZA",
    body: "Your account is ready.",
    payload: {},
    read_at: null,
    created_at: "2026-08-27T08:00:00Z",
    ...overrides,
  };
}

const actor = {
  displayName: "Lerato",
  age: 28,
  city: "Cape Town",
  photoUrl: "https://cdn.example/lerato.jpg",
};

describe("notification presentation", () => {
  it("maps known D8N types into filter tabs without inventing views or preference updates", () => {
    expect(notificationKind("dateza.like_received")).toBe("like");
    expect(notificationFilterFor("dateza.like_received")).toBe("likes");
    expect(notificationFilterFor("dateza.match_created")).toBe("matches");
    expect(notificationFilterFor("dateza.message_received")).toBe("messages");
    expect(notificationFilterFor("dateza.opener_received")).toBe("messages");
    expect(notificationFilterFor("dateza.welcome")).toBe("activity");
    expect(notificationFilterFor("dateza.profile_viewed")).toBe("activity");
    expect(notificationKind("dateza.profile_viewed")).toBe("activity");
  });

  it("counts unread message and opener rows for the Chats badge without inventing conversation read state", () => {
    expect(
      countUnreadChatNotifications([
        notice({ id: "m1", type: "dateza.message_received" }),
        notice({ id: "o1", type: "dateza.opener_received" }),
        notice({ id: "m2", type: "dateza.message_received", read_at: "2026-08-27T09:00:00Z" }),
        notice({ id: "l1", type: "dateza.like_received" }),
      ]),
    ).toBe(2);
  });

  it("finds unread chat notifications for a specific conversation target", () => {
    const message = notice({
      id: "m1",
      type: "dateza.message_received",
      payload: {
        actor: { profile_id: "p1" },
        target: { type: "conversation", id: "c1" },
      },
    });
    const otherConversation = notice({
      id: "m2",
      type: "dateza.message_received",
      payload: {
        actor: { profile_id: "p2" },
        target: { type: "conversation", id: "c2" },
      },
    });
    const opener = notice({
      id: "o1",
      type: "dateza.opener_received",
      payload: {
        actor: { profile_id: "p3" },
        target: { type: "opener", id: "o1" },
      },
    });

    expect(unreadChatNotificationsForConversation([message, otherConversation, opener], "c1")).toEqual([message]);
  });

  it("uses the actor name for likes and matches, and keeps D8N copy when the profile is unavailable", () => {
    const like = notice({
      type: "dateza.like_received",
      title: "Someone likes you",
      body: "You have a new like on DateZA. Open the app to see who.",
    });
    expect(notificationCopy(like, actor)).toEqual({
      title: "Lerato liked your profile",
      subtitle: "Lerato, 28, Cape Town",
    });
    expect(notificationCopy(like, undefined)).toEqual({
      title: "Someone likes you",
      subtitle: like.body,
    });
    expect(
      notificationCopy(
        notice({ type: "dateza.match_created", title: "It's a match!", body: "Say hello." }),
        actor,
      ),
    ).toEqual({
      title: "It's a match!",
      subtitle: "You and Lerato like each other",
    });
  });

  it("does not invent a message snippet from the payload", () => {
    const message = notice({
      type: "dateza.message_received",
      title: "New message",
      body: "You have a new message on DateZA.",
      payload: { actor: { profile_id: "p1" }, target: { type: "conversation", id: "c1" } },
    });
    expect(notificationCopy(message, actor).subtitle).toBe("You have a new message on DateZA.");
  });

  it("collects unique actor ids and unread filter counts", () => {
    const items = [
      notice({
        id: "a",
        type: "dateza.like_received",
        payload: { actor: { profile_id: "p1" }, target: { type: "profile", id: "p1" } },
      }),
      notice({
        id: "b",
        type: "dateza.like_received",
        payload: { actor: { profile_id: "p1" }, target: { type: "profile", id: "p1" } },
        read_at: "2026-08-27T09:00:00Z",
      }),
      notice({
        id: "c",
        type: "dateza.match_created",
        payload: { actor: { profile_id: "p2" }, target: { type: "match", id: "m1" } },
      }),
      notice({ id: "d", type: "dateza.welcome" }),
    ];
    expect(actorProfileIds(items)).toEqual(["p1", "p2"]);
    expect(unreadCountForFilter(items, "all")).toBe(3);
    expect(unreadCountForFilter(items, "likes")).toBe(1);
    expect(items.filter((item) => matchesNotificationFilter(item, "activity"))).toHaveLength(1);
    expect(countPhrase(1, "new like", "new likes")).toBe("1 new like");
    expect(countPhrase(2, "new like", "new likes")).toBe("2 new likes");
  });

  it("formats compact relative times for the inbox", () => {
    const now = Date.parse("2026-08-27T12:00:00Z");
    expect(compactRelativeTime("2026-08-27T11:58:00Z", now)).toBe("2m ago");
    expect(compactRelativeTime("2026-08-27T11:00:00Z", now)).toBe("1h ago");
    expect(compactRelativeTime("2026-08-26T12:00:00Z", now)).toBe("1d ago");
  });
});
