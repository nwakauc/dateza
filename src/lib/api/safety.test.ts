import { beforeEach, describe, expect, it, vi } from "vitest";
import { blockProfile, reportContent, reportMessage, reportProfile, reportSubmission } from "./safety.ts";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("profile safety APIs", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("posts a profile report with a documented reason", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { reported: true, created: true }));
    await expect(reportProfile("p1", { reason: "harassment", note: "Unwanted messages" })).resolves.toEqual({
      reported: true,
      created: true,
    });
    const request = vi.mocked(fetch).mock.calls[0]?.[0];
    expect(String(request)).toContain("/api/v1/profiles/p1/report");
  });

  it("maps a notes-only report onto the documented other reason", () => {
    expect(reportSubmission("", "  Keeps creating accounts.  ")).toEqual({
      reason: "other",
      note: "Keeps creating accounts.",
    });
    expect(reportSubmission("harassment", "")).toEqual({ reason: "harassment" });
    expect(reportSubmission("", "   ")).toBeUndefined();
  });

  it("posts a message report to POST /reports with target_type message", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(201, { report: { status: "received" }, created: true, blocked: false }));
    await expect(reportMessage("msg-1", { reason: "harassment", note: "Unwanted photo" })).resolves.toEqual({
      reported: true,
      created: true,
    });
    const call = vi.mocked(fetch).mock.calls[0];
    expect(String(call?.[0])).toBe("/api/v1/reports");
    expect(call?.[1]?.body).toBe(
      JSON.stringify({
        target_type: "message",
        target_id: "msg-1",
        reason: "harassment",
        details: "Unwanted photo",
      }),
    );
  });

  it("posts a conversation report to POST /reports with target_type conversation", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(201, { report: { status: "received" }, created: true, blocked: false }));
    await expect(reportContent("conversation", "c1", { reason: "harassment" })).resolves.toEqual({
      reported: true,
      created: true,
    });
    const call = vi.mocked(fetch).mock.calls[0];
    expect(String(call?.[0])).toBe("/api/v1/reports");
    expect(call?.[1]?.body).toBe(
      JSON.stringify({
        target_type: "conversation",
        target_id: "c1",
        reason: "harassment",
      }),
    );
  });

  it("posts a photo report and an opener report with the documented target types", async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(jsonResponse(201, { report: { status: "received" }, created: true, blocked: false })),
    );
    await reportContent("profile_media", "ph1", { reason: "inappropriate_content", note: "Unwanted photo" });
    await reportContent("hook", "o1", { reason: "spam" });
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.body).toBe(
      JSON.stringify({
        target_type: "profile_media",
        target_id: "ph1",
        reason: "inappropriate_content",
        details: "Unwanted photo",
      }),
    );
    expect(vi.mocked(fetch).mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({
        target_type: "hook",
        target_id: "o1",
        reason: "spam",
      }),
    );
  });

  it("posts a block and treats created:false as success", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { blocked: true, created: false }));
    await expect(blockProfile("p1")).resolves.toEqual({ blocked: true, created: false });
  });
});
