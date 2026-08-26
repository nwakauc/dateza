import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors.ts";
import { parseConfiguredOpeners, sendOpener } from "./opener.ts";
import { openerSendAllowed } from "./openerTypes.ts";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("opener adapter", () => {
  it("posts opener_key to the D8N send path", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, {
        opener: { id: "o1", status: "pending", created_at: "2026-08-26T00:00:00Z", expires_at: "2026-08-28T00:00:00Z" },
      }),
    );
    await sendOpener("p1", "coffee_or_tea");
    const call = vi.mocked(fetch).mock.calls[0];
    expect(String(call[0])).toContain("/api/v1/profiles/p1/opener");
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.body).toBe(JSON.stringify({ opener_key: "coffee_or_tea" }));
  });

  it("does not invent catalogue entries", () => {
    expect(parseConfiguredOpeners([{ key: "coffee_or_tea", text: "Coffee or tea?" }])).toEqual([
      { key: "coffee_or_tea", text: "Coffee or tea?" },
    ]);
    expect(parseConfiguredOpeners([{ key: "retired", text: "" }])).toEqual([]);
    expect(parseConfiguredOpeners([{ key: "weekend_plans", label: "What does your perfect weekend look like?" }])).toEqual([
      { key: "weekend_plans", text: "What does your perfect weekend look like?" },
    ]);
  });

  it("surfaces backend error codes without claiming success", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(409, { error: "already_hooked" }));
    await expect(sendOpener("p1", "coffee_or_tea")).rejects.toBeInstanceOf(ApiError);
  });

  it("allows send unless D8N already has a live opener or conversation", () => {
    expect(openerSendAllowed("available")).toBe(true);
    expect(openerSendAllowed(undefined)).toBe(true);
    expect(openerSendAllowed("unavailable")).toBe(true);
    expect(openerSendAllowed("pending")).toBe(false);
    expect(openerSendAllowed("hooked")).toBe(false);
  });
});
