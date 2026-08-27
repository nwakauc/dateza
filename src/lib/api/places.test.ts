import { describe, expect, it, vi } from "vitest";
import { filterPlaceSearchHits, listPlaces, loadPlaceSearchIndex, searchPlaces } from "./places.ts";
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

describe("place search index", () => {
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
  const seaPoint = {
    id: 31,
    kind: "locality",
    name: "Sea Point",
    code: "sea-point",
    has_children: false,
  };

  function placesBody(url: string) {
    const parentId = new URL(url, "https://dateza.test").searchParams.get("parent_id");
    if (parentId === "11") return { places: [capeTown] };
    if (parentId === "21") return { places: [seaPoint] };
    return { places: [westernCape] };
  }

  it("flattens nested Places and matches suburb names without looping on cyclic mocks", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      return Promise.resolve(jsonResponse(200, placesBody(url)));
    });

    const hits = await loadPlaceSearchIndex();
    expect(hits.map((hit) => hit.displayPath)).toEqual([
      "Western Cape",
      "Cape Town, Western Cape",
      "Sea Point, Cape Town, Western Cape",
    ]);
    expect(filterPlaceSearchHits(hits, "sea")).toEqual([
      { id: 31, name: "Sea Point", displayPath: "Sea Point, Cape Town, Western Cape" },
    ]);
    expect(await searchPlaces("sea")).toHaveLength(1);
    expect(await searchPlaces("s")).toEqual([]);
  });

  it("does not infinite-loop when a parent_id returns the same Place", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(jsonResponse(200, { places: [westernCape] })));
    const hits = await loadPlaceSearchIndex();
    expect(hits).toEqual([{ id: 11, name: "Western Cape", displayPath: "Western Cape" }]);
  });
});
