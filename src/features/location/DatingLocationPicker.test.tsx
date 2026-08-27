import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatingLocationPicker } from "./DatingLocationPicker.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";

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

const sandton = {
  id: 41,
  kind: "locality",
  name: "Sandton",
  code: "sandton",
  has_children: false,
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function isPlacesUrl(url: string): boolean {
  return url === "/api/v1/places" || url.startsWith("/api/v1/places?");
}

function placesBody(url: string) {
  const parentId = new URL(url, "https://dateza.test").searchParams.get("parent_id");
  if (parentId === "11") return { places: [capeTown] };
  if (parentId === "21") return { places: [seaPoint] };
  return { places: [westernCape, { id: 12, kind: "region", name: "Gauteng", code: "gauteng", has_children: true }] };
}

function stubGeolocation(geolocation: Partial<Geolocation> | undefined) {
  Object.defineProperty(navigator, "geolocation", {
    value: geolocation,
    configurable: true,
  });
}

function successfulPosition(): GeolocationPosition {
  return {
    coords: {
      latitude: -33.9249,
      longitude: 18.4241,
      accuracy: 25,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: Date.parse("2026-08-25T02:05:01Z"),
    toJSON: () => ({}),
  };
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  vi.mocked(fetch).mockImplementation((input, init) => {
    const url = requestUrl(input);
    if (url.includes("nominatim") || url.includes("openstreetmap") || url.includes("maps.googleapis") || url.includes("mapbox")) {
      return Promise.resolve(jsonResponse(500, { error: "geocoder_should_not_run" }));
    }
    return Promise.resolve(handler(url, init));
  });
}

function storageHoldsCoordinates(): boolean {
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    const value = key ? window.localStorage.getItem(key) : null;
    if (key?.includes("lat") || key?.includes("coord") || value?.includes("-33.9249") || value?.includes("18.4241")) {
      return true;
    }
  }
  return false;
}

afterEach(() => {
  stubGeolocation(undefined);
});

describe("DatingLocationPicker", () => {
  it("shows a configured Place label without prompting for a new choice", () => {
    render(
      <DatingLocationPicker
        savedLabel="Sea Point, Cape Town, Western Cape"
        onSaved={vi.fn()}
      />,
    );
    expect(screen.getByText("Dating from Sea Point, Cape Town, Western Cape")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use my current location/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /search suburb, city or area/i })).toBeInTheDocument();
  });

  it("shows Using your current area for a configured device location without a Place label", () => {
    render(<DatingLocationPicker configuredWithoutPlace onSaved={vi.fn()} />);
    expect(screen.getByText("Using your current area")).toBeInTheDocument();
    expect(screen.queryByText(/dating from/i)).not.toBeInTheDocument();
  });

  it("does not request geolocation or Places until the member acts", async () => {
    const getCurrentPosition = vi.fn();
    stubGeolocation({ getCurrentPosition });
    setBearerToken("opaque-session-token");
    const urls: string[] = [];
    mockFetch((url) => {
      urls.push(url);
      return jsonResponse(404, { error: "not_found" });
    });

    render(<DatingLocationPicker onSaved={vi.fn()} />);

    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(urls.some((url) => isPlacesUrl(url))).toBe(false);
    expect(screen.getByText(/we use your general area to show people nearby/i)).toBeInTheDocument();
  });

  it("writes GPS to PUT /profile/location, refetches GET /profile/location, and does not store coordinates", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    setBearerToken("opaque-session-token");
    let putBody: Record<string, unknown> | undefined;
    let getAfterPut = false;
    stubGeolocation({
      getCurrentPosition: (success) => {
        (success as PositionCallback)(successfulPosition());
      },
    });
    mockFetch((url, init) => {
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/profile/location") && method === "PUT") {
        putBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return jsonResponse(200, {
          location: { configured: true, accuracy_meters: 25, source: "device", captured_at: "2026-08-25T02:05:01Z", place: null },
        });
      }
      if (url.endsWith("/api/v1/profile/location") && method === "GET") {
        getAfterPut = true;
        return jsonResponse(200, {
          location: { configured: true, accuracy_meters: 25, source: "device", captured_at: "2026-08-25T02:05:01Z", place: null },
        });
      }
      return jsonResponse(404, { error: "not_found" });
    });

    render(<DatingLocationPicker onSaved={onSaved} />);
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(getAfterPut).toBe(true);
    expect(putBody).toEqual({
      latitude: -33.9249,
      longitude: 18.4241,
      accuracy_meters: 25,
      captured_at: "2026-08-25T02:05:01.000Z",
    });
    expect(screen.getByText("Using your current area")).toBeInTheDocument();
    expect(storageHoldsCoordinates()).toBe(false);
    expect(onSaved.mock.calls[0]?.[0]).toMatchObject({ configured: true, source: "device", place: null });
  });

  it("keeps area search available when permission is denied", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    stubGeolocation({
      getCurrentPosition: (_success, error) => {
        (error as PositionErrorCallback)({
          code: 1,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "denied",
        } as GeolocationPositionError);
      },
    });
    mockFetch(() => jsonResponse(404, { error: "not_found" }));

    render(<DatingLocationPicker onSaved={onSaved} />);
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/location access was denied/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /search suburb, city or area/i })).toBeEnabled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("preserves a saved Place when device location times out", async () => {
    const user = userEvent.setup();
    stubGeolocation({
      getCurrentPosition: (_success, error) => {
        (error as PositionErrorCallback)({
          code: 3,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
          message: "timeout",
        } as GeolocationPositionError);
      },
    });
    mockFetch(() => jsonResponse(404, { error: "not_found" }));

    render(
      <DatingLocationPicker savedLabel="Sea Point, Cape Town, Western Cape" onSaved={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/we couldn't get your location/i)).toBeInTheDocument();
    expect(screen.getByText("Dating from Sea Point, Cape Town, Western Cape")).toBeInTheDocument();
  });

  it("falls back to area search when the browser has no geolocation API", () => {
    stubGeolocation(undefined);
    render(<DatingLocationPicker onSaved={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /use my current location/i }));
    expect(screen.getByText(/can't share a location/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use my current location/i })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: /search suburb, city or area/i })).toBeEnabled();
  });

  it("debounces suburb search, calls D8N Places only, and saves the selected place_id", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    setBearerToken("opaque-session-token");
    const urls: string[] = [];
    let savedBody: Record<string, unknown> | undefined;
    let getAfterPut = false;
    mockFetch((url, init) => {
      urls.push(url);
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      if (url.endsWith("/api/v1/profile/place") && (init?.method ?? "GET") === "PUT") {
        savedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return jsonResponse(200, {
          location: {
            configured: true,
            accuracy_meters: 5000,
            source: "place",
            captured_at: "2026-08-27T04:00:00Z",
            place: { id: 31, name: "Sea Point", display_path: "Sea Point, Cape Town, Western Cape" },
          },
        });
      }
      if (url.endsWith("/api/v1/profile/location") && (init?.method ?? "GET") === "GET") {
        getAfterPut = true;
        return jsonResponse(200, {
          location: {
            configured: true,
            accuracy_meters: 5000,
            source: "place",
            captured_at: "2026-08-27T04:00:00Z",
            place: { id: 31, name: "Sea Point", display_path: "Sea Point, Cape Town, Western Cape" },
          },
        });
      }
      return jsonResponse(404, { error: "not_found" });
    });

    render(<DatingLocationPicker onSaved={onSaved} />);
    expect(urls.some((url) => isPlacesUrl(url))).toBe(false);
    await user.type(screen.getByRole("combobox", { name: /search suburb, city or area/i }), "sea");

    expect(await screen.findByRole("option", { name: /sea point/i })).toBeInTheDocument();
    expect(screen.getByText("Cape Town, Western Cape")).toBeInTheDocument();
    expect(urls.some((url) => url.includes("nominatim") || url.includes("openstreetmap"))).toBe(false);
    expect(urls.some((url) => isPlacesUrl(url))).toBe(true);
    await user.click(screen.getByRole("option", { name: /sea point/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(savedBody).toEqual({ place_id: 31 });
    expect(getAfterPut).toBe(true);
    expect(screen.getByText("Dating from Sea Point, Cape Town, Western Cape")).toBeInTheDocument();
  });

  it("shows a no-results state without inserting free text", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    mockFetch((url) => {
      if (isPlacesUrl(url)) return jsonResponse(200, { places: [sandton] });
      return jsonResponse(404, { error: "not_found" });
    });

    render(<DatingLocationPicker onSaved={vi.fn()} />);
    await user.type(screen.getByRole("combobox"), "zzzzz");

    expect(await screen.findByText(/we couldn't find that area/i)).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("keeps current location available when area search fails, without calling an external geocoder", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    const urls: string[] = [];
    mockFetch((url) => {
      urls.push(url);
      if (isPlacesUrl(url)) return jsonResponse(500, { error: "unavailable" });
      return jsonResponse(404, { error: "not_found" });
    });

    render(
      <DatingLocationPicker savedLabel="Sandton, Johannesburg, Gauteng" onSaved={vi.fn()} />,
    );
    await user.type(screen.getByRole("combobox"), "sand");

    expect(await screen.findByText(/area search is temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use my current location/i })).toBeEnabled();
    expect(screen.getByText("Dating from Sandton, Johannesburg, Gauteng")).toBeInTheDocument();
    expect(urls.some((url) => url.includes("nominatim") || url.includes("openstreetmap"))).toBe(false);
  });
});
