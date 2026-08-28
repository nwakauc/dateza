import { describe, expect, it, vi } from "vitest";
import { geocodeSuburb } from "./geocode.ts";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("geocodeSuburb", () => {
  it("returns an empty list for queries shorter than two characters", async () => {
    vi.mocked(fetch).mockClear();
    await expect(geocodeSuburb("a")).resolves.toEqual({ results: [] });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps Nominatim hits into displayName and coordinates", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, [
        {
          lat: "-33.9149",
          lon: "18.3876",
          display_name: "Sea Point, Cape Town, Western Cape, South Africa",
        },
      ]),
    );

    await expect(geocodeSuburb("sea point")).resolves.toEqual({
      results: [
        {
          displayName: "Sea Point, Cape Town, Western Cape, South Africa",
          latitude: -33.9149,
          longitude: 18.3876,
        },
      ],
    });
  });

  it("retries with a corrected spelling when the first search has no matches", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(200, []))
      .mockResolvedValueOnce(
        jsonResponse(200, [
          {
            lat: "-34.0405905",
            lon: "18.6674201",
            display_name: "Khayelitsha, City of Cape Town, Western Cape, South Africa",
          },
        ]),
      );

    await expect(geocodeSuburb("kayelitsha")).resolves.toEqual({
      suggestedQuery: "Khayelitsha",
      results: [
        {
          displayName: "Khayelitsha, City of Cape Town, Western Cape, South Africa",
          latitude: -34.0405905,
          longitude: 18.6674201,
        },
      ],
    });

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
    const secondUrl = String(vi.mocked(fetch).mock.calls[1]?.[0]);
    expect(secondUrl).toContain("Khayelitsha");
  });

  it("throws when Nominatim returns a non-OK response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(503, { error: "busy" }));
    await expect(geocodeSuburb("sandton")).rejects.toThrow("geocode_failed");
  });
});
