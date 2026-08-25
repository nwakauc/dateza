export type GeocodeResult = {
  displayName: string;
  latitude: number;
  longitude: number;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const GEOCODE_TIMEOUT_MS = 8_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Free-text suburb/area fallback for members who can't or won't grant
 * device geolocation (see LocationStep.tsx) — otherwise they're stuck with
 * no way to satisfy DateZA's location requirement at all. Uses OpenStreetMap
 * Nominatim: no API key, but rate-limited to ~1 request/second and its usage
 * policy expects the app to identify itself via Referer (sent automatically
 * by the browser) — fine at onboarding scale, but revisit with a dedicated
 * provider or a backend proxy if volume grows. This is a third-party
 * request, not a D8N one: never send DateZA credentials/CSRF here.
 */
export async function geocodeSuburb(query: string): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", trimmed);
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
