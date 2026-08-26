import { beforeEach, describe, expect, it, vi } from "vitest";
import { blockProfile, reportProfile } from "./safety.ts";

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

  it("posts a block and treats created:false as success", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { blocked: true, created: false }));
    await expect(blockProfile("p1")).resolves.toEqual({ blocked: true, created: false });
  });
});
