import { describe, expect, it, vi } from "vitest";
import { getNotificationPreferences, parseDatingEventPayload, updateNotificationPreferences } from "./notifications.ts";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("notification preferences", () => {
  it("reads effective email and push flags", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { preferences: { product_email_enabled: true, push_enabled: false } }),
    );
    const result = await getNotificationPreferences();
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe("/api/v1/notifications/preferences");
    expect(result).toEqual({ product_email_enabled: true, push_enabled: false });
  });

  it("patches a JSON boolean without stringifying it", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { preferences: { product_email_enabled: false, push_enabled: true } }),
    );
    await updateNotificationPreferences({ product_email_enabled: false });
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call?.[1]?.method).toBe("PATCH");
    expect(call?.[1]?.body).toBe(JSON.stringify({ product_email_enabled: false }));
    expect(String(call?.[1]?.body)).not.toContain('"false"');
  });
});

describe("dating event payload", () => {
  it("accepts actor and target public UUIDs without inventing extra fields", () => {
    expect(
      parseDatingEventPayload({
        actor: { profile_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" },
        target: { type: "conversation", id: "11111111-2222-4333-8444-555555555555" },
      }),
    ).toEqual({
      actor: { profile_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" },
      target: { type: "conversation", id: "11111111-2222-4333-8444-555555555555" },
    });
  });
});
