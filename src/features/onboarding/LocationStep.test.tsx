import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationStep } from "./LocationStep.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { hasConfirmedLocation } from "../../lib/locationConfirmationStore.ts";

const PROFILE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

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
  return { places: [westernCape] };
}

function stubGeolocation(geolocation: Partial<Geolocation> | undefined) {
  Object.defineProperty(navigator, "geolocation", {
    value: geolocation,
    configurable: true,
  });
}

function successfulPosition(overrides: Partial<GeolocationCoordinates> = {}): GeolocationPosition {
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
      ...overrides,
    },
    timestamp: Date.parse("2026-08-25T02:05:01Z"),
    toJSON: () => ({}),
  };
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  vi.mocked(fetch).mockImplementation((input, init) => {
    const url = requestUrl(input);
    if (url.includes("nominatim.openstreetmap.org")) {
      return Promise.resolve(jsonResponse(500, { error: "geocoder_should_not_run" }));
    }
    return Promise.resolve(handler(url, init));
  });
}

afterEach(() => {
  stubGeolocation(undefined);
});

describe("LocationStep", () => {
  it("does not request geolocation on mount, only after the member acts", async () => {
    const getCurrentPosition = vi.fn();
    stubGeolocation({ getCurrentPosition });
    setBearerToken("opaque-session-token");
    mockFetch((url) => {
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      return jsonResponse(404, { error: "not_found" });
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={vi.fn()} />);

    expect(await screen.findByRole("button", { name: /use my current location/i })).toBeInTheDocument();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("loads dating areas from D8N Places on mount and never calls Nominatim", async () => {
    setBearerToken("opaque-session-token");
    const urls: string[] = [];
    mockFetch((url) => {
      urls.push(url);
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      return jsonResponse(404, { error: "not_found" });
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={vi.fn()} />);

    expect(await screen.findByRole("button", { name: "Western Cape" })).toBeInTheDocument();
    expect(urls.some((url) => url.includes("nominatim"))).toBe(false);
    expect(urls.some((url) => url === "/api/v1/places")).toBe(true);
  });

  it("maps a successful GPS fix to PUT /api/v1/profile/location and calls onSuccess once D8N confirms it", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    setBearerToken("opaque-session-token");
    let requestBody: Record<string, unknown> | undefined;
    stubGeolocation({
      getCurrentPosition: (success) => {
        (success as PositionCallback)(successfulPosition());
      },
    });
    mockFetch((url, init) => {
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      if (url.endsWith("/api/v1/profile/location") && (init?.method ?? "GET") === "PUT") {
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return jsonResponse(200, {
          location: { configured: true, accuracy_meters: 25, source: "device", captured_at: "2026-08-25T02:05:01Z" },
        });
      }
      return jsonResponse(404, { error: "not_found" });
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={onSuccess} />);
    await user.click(await screen.findByRole("button", { name: /use my current location/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(requestBody).toEqual({
      latitude: -33.9249,
      longitude: 18.4241,
      accuracy_meters: 25,
      captured_at: "2026-08-25T02:05:01.000Z",
    });
    expect(hasConfirmedLocation(PROFILE_ID)).toBe(true);
  });

  it("does not publish or call onSuccess when the member denies permission, and explains why", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    setBearerToken("opaque-session-token");
    stubGeolocation({
      getCurrentPosition: (_success, error) => {
        (error as PositionErrorCallback)({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "denied" } as GeolocationPositionError);
      },
    });
    mockFetch((url) => {
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      return jsonResponse(404, { error: "not_found" });
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={onSuccess} />);
    await user.click(await screen.findByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/dateza needs a dating location/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(hasConfirmedLocation(PROFILE_ID)).toBe(false);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("distinguishes position-unavailable from timeout with different copy", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    stubGeolocation({
      getCurrentPosition: (_success, error) => {
        (error as PositionErrorCallback)({ code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "unavailable" } as GeolocationPositionError);
      },
    });
    mockFetch((url) => {
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      return jsonResponse(404, { error: "not_found" });
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={vi.fn()} />);
    await user.click(await screen.findByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/couldn't work out your location/i)).toBeInTheDocument();
  });

  it("shows unsupported guidance and disables the action when the browser has no geolocation API", async () => {
    stubGeolocation(undefined);
    setBearerToken("opaque-session-token");
    mockFetch((url) => {
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      return jsonResponse(404, { error: "not_found" });
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={vi.fn()} />);
    const button = await screen.findByRole("button", { name: /use my current location/i });
    fireEvent.click(button);

    expect(screen.getByText(/can't share a device location/i)).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("shows a field-level message and does not call onSuccess when D8N rejects the GPS fix", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    setBearerToken("opaque-session-token");
    stubGeolocation({
      getCurrentPosition: (success) => {
        (success as PositionCallback)(successfulPosition());
      },
    });
    mockFetch((url) => {
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      if (url.endsWith("/api/v1/profile/location")) {
        return jsonResponse(422, { error: "invalid_location", details: { latitude: ["must be less than or equal to 90"] } });
      }
      return jsonResponse(404, { error: "not_found" });
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={onSuccess} />);
    await user.click(await screen.findByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/must be less than or equal to 90/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("does not start a second geolocation request while one is already in flight", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn();
    setBearerToken("opaque-session-token");
    stubGeolocation({ getCurrentPosition });
    mockFetch((url) => {
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      return jsonResponse(404, { error: "not_found" });
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={vi.fn()} />);
    const button = await screen.findByRole("button", { name: /use my current location/i });
    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("treats an explicit configured:false as incomplete rather than success", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    setBearerToken("opaque-session-token");
    stubGeolocation({
      getCurrentPosition: (success) => {
        (success as PositionCallback)(successfulPosition());
      },
    });
    mockFetch((url) => {
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      if (url.endsWith("/api/v1/profile/location")) {
        return jsonResponse(200, { location: { configured: false, accuracy_meters: null, source: null, captured_at: null } });
      }
      return jsonResponse(404, { error: "not_found" });
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={onSuccess} />);
    await user.click(await screen.findByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/couldn't confirm your location/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("lets a member choose a D8N Place instead of GPS and saves through PUT /profile/place", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    setBearerToken("opaque-session-token");
    let savedBody: Record<string, unknown> | undefined;
    mockFetch((url, init) => {
      if (isPlacesUrl(url)) return jsonResponse(200, placesBody(url));
      if (url.endsWith("/api/v1/profile/place") && (init?.method ?? "GET") === "PUT") {
        savedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return jsonResponse(200, {
          location: {
            configured: true,
            accuracy_meters: 8000,
            source: "place",
            captured_at: "2026-08-27T04:00:00Z",
            place: { id: 11, name: "Western Cape", display_path: "Western Cape" },
          },
        });
      }
      return jsonResponse(404, { error: "not_found" });
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={onSuccess} />);
    await user.click(await screen.findByRole("button", { name: /use western cape as dating location/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(savedBody).toEqual({ place_id: 11 });
    expect(hasConfirmedLocation(PROFILE_ID)).toBe(true);
  });
});
