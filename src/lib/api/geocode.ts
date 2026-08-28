import { resolveAreaSearchQuery } from "./areaSearch.ts";

export type GeocodeResult = {
  displayName: string;
  latitude: number;
  longitude: number;
};

export type GeocodeSuburbResponse = {
  results: GeocodeResult[];
  /** Set when DateZA searched using a corrected spelling. */
  suggestedQuery?: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const GEOCODE_TIMEOUT_MS = 8_000;

export const GEOCODE_SEARCH_MIN_CHARS = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function fetchGeocodeResults(query: string): Promise<GeocodeResult[]> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", query);
  url.searchParams.set("countrycodes", "za");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "0");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    credentials: "omit",
    signal: AbortSignal.timeout(GEOCODE_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error("geocode_failed");
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("invalid_geocode_response");
  }

  const results: GeocodeResult[] = [];
  for (const item of data) {
    if (!isRecord(item)) {
      continue;
    }
    const latitude = Number.parseFloat(String(item.lat));
    const longitude = Number.parseFloat(String(item.lon));
    const displayName = item.display_name;
    if (Number.isFinite(latitude) && Number.isFinite(longitude) && typeof displayName === "string") {
      results.push({ displayName, latitude, longitude });
    }
  }
  return results;
}

/**
 * Free-text suburb/area search for members who can't or won't grant device
 * geolocation. Uses OpenStreetMap Nominatim (no API key; rate-limited). This
 * is a third-party browser request — never send DateZA credentials here.
 * Resolved coordinates are saved through PUT /api/v1/profile/location with
 * coarse accuracy, same as the GPS path.
 */
export async function geocodeSuburb(query: string): Promise<GeocodeSuburbResponse> {
  const trimmed = query.trim();
  if (trimmed.length < GEOCODE_SEARCH_MIN_CHARS) {
    return { results: [] };
  }

  const direct = await fetchGeocodeResults(trimmed);
  if (direct.length > 0) {
    return { results: direct };
  }

  const { searchQuery, suggestedLabel } = resolveAreaSearchQuery(trimmed);
  if (searchQuery === trimmed) {
    return { results: [] };
  }

  const corrected = await fetchGeocodeResults(searchQuery);
  return {
    results: corrected,
    suggestedQuery: corrected.length > 0 ? suggestedLabel ?? searchQuery : undefined,
  };
}
