import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors.ts";
import { listReceivedOpeners, openerSendClosed, parseConfiguredOpeners, replyToOpener, sendOpener } from "./opener.ts";
import { openerSendAllowed } from "./openerTypes.ts";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const publicProfile = {
  id: "s1",
  display_name: "Lerato",
  age: 28,
  bio: null,
  gender: null,
  pronouns: null,
  country_code: "ZA",
  city: "Cape Town",
  occupation: null,
  job_title: null,
  school_or_institution: null,
  looking_for_text: null,
  height_cm: null,
  body_type: null,
  languages_spoken: [],
  smoking: null,
  drinking: null,
  fitness: null,
  photos: [],
  options: {},
};

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

  it("allows send only when D8N opener_state is available or omitted", () => {
    expect(openerSendAllowed("available")).toBe(true);
    expect(openerSendAllowed(undefined)).toBe(true);
    expect(openerSendAllowed("unavailable")).toBe(false);
    expect(openerSendAllowed("pending")).toBe(false);
    expect(openerSendAllowed("hooked")).toBe(false);
  });

  it("treats already-liked send failures as closed", () => {
    expect(openerSendClosed(new ApiError(409, "already_liked", "conflict"))).toBe(true);
    expect(openerSendClosed(new ApiError(409, "already_hooked", "conflict"))).toBe(true);
    expect(openerSendClosed(new ApiError(500, "server_error", "fail"))).toBe(false);
  });

  it("parses GET /openers including pagination cursor", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, {
        openers: [
          {
            id: "o1",
            message: "Coffee or tea?",
            created_at: "2026-08-26T00:00:00Z",
            expires_at: "2026-08-28T00:00:00Z",
            sender: publicProfile,
          },
        ],
        next_cursor: "next-openers",
      }),
    );
    const result = await listReceivedOpeners();
    expect(String(vi.mocked(fetch).mock.calls[0]?.[0])).toContain("/api/v1/openers");
    expect(result.openers).toHaveLength(1);
    expect(result.openers[0]?.id).toBe("o1");
    expect(result.next_cursor).toBe("next-openers");
  });

  it("parses reply as match conversation plus stored message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(201, {
        conversation: {
          id: "c1",
          match_id: "m1",
          status: "active",
          created_at: "2026-08-26T00:00:00Z",
          profile: publicProfile,
          last_message: null,
        },
        message: {
          id: "msg-1",
          conversation_id: "c1",
          sender_id: "viewer",
          body: "Tea, always.",
          created_at: "2026-08-26T00:01:00Z",
        },
      }),
    );
    const result = await replyToOpener("o1", "Tea, always.");
    const call = vi.mocked(fetch).mock.calls[0];
    expect(String(call?.[0])).toContain("/api/v1/openers/o1/reply");
    expect(call?.[1]?.body).toBe(JSON.stringify({ message: "Tea, always." }));
    expect(result.conversation.id).toBe("c1");
    expect(result.conversation.match_id).toBe("m1");
    expect(result.message.body).toBe("Tea, always.");
  });
});
