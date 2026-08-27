import { describe, expect, it } from "vitest";
import { parseDatingEventPayload } from "../../lib/api/notifications.ts";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import { resolveNotificationDestination } from "./notificationDestination.ts";

function notice(payload: Record<string, unknown>, type = "dateza.like_received"): ProductNotification {
  return {
    id: "n1",
    type,
    title: "Update",
    body: "Something happened.",
    payload,
    read_at: null,
    created_at: "2026-08-27T08:00:00Z",
  };
}

describe("resolveNotificationDestination", () => {
  it("maps dating-event targets to DateZA routes", () => {
    expect(
      resolveNotificationDestination(
        notice({
          actor: { profile_id: "actor-1" },
          target: { type: "profile", id: "profile-1" },
        }),
      ),
    ).toBe("/profile/profile-1");
    expect(
      resolveNotificationDestination(
        notice(
          { actor: { profile_id: "actor-2" }, target: { type: "match", id: "match-1" } },
          "dateza.match_created",
        ),
      ),
    ).toBe("/profile/actor-2");
    expect(
      resolveNotificationDestination(
        notice(
          { actor: { profile_id: "actor-3" }, target: { type: "opener", id: "opener-1" } },
          "dateza.opener_received",
        ),
      ),
    ).toBe("/chats");
    expect(
      resolveNotificationDestination(
        notice(
          { actor: { profile_id: "actor-4" }, target: { type: "conversation", id: "conv-1" } },
          "dateza.message_received",
        ),
      ),
    ).toBe("/chats?conversation=conv-1");
  });

  it("does not invent a route for welcome or malformed payloads", () => {
    expect(resolveNotificationDestination(notice({}, "dateza.welcome"))).toBeNull();
    expect(parseDatingEventPayload({})).toBeNull();
  });
});
