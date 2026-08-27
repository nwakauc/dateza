import { describe, expect, it, vi } from "vitest";
import { listPlaces } from "./places.ts";
import { setBearerToken } from "./tokenStore.ts";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const westernCape = {
  id: 11,
  kind: "region",
  name: "Western Cape",
  code: "western-cape",
  has_children: true,
};

const capeTown = {
  id: 21,
  kind: "city",
  name: "Cape Town",
  code: "cape-town",
  has_children: true,
};

describe("listPlaces", () => {
  it("loads top-level places from GET /api/v1/places without a parent_id", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { places: [westernCape] }));

    const places = await listPlaces();

    expect(places).toEqual([westernCape]);
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe("/api/v1/places");
  });

  it("requests children with the integer parent_id the API expects", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { places: [capeTown] }));

    const places = await listPlaces(11);

    expect(places).toEqual([capeTown]);
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe("/api/v1/places?parent_id=11");
  });
});
