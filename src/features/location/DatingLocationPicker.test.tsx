import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatingLocationPicker } from "./DatingLocationPicker.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";

const seaPointHit = {
  lat: "-33.9149",
  lon: "18.3876",
  display_name: "Sea Point, Cape Town, Western Cape, South Africa",
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

function isNominatimUrl(url: string): boolean {
  return url.includes("nominatim.openstreetmap.org");
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
  it("shows a saved area label without prompting for a new choice", () => {
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

  it("shows Using your current area for a configured device location without a saved label", () => {
    render(<DatingLocationPicker configuredWithoutPlace onSaved={vi.fn()} />);
    expect(screen.getByText("Using your current area")).toBeInTheDocument();
    expect(screen.queryByText(/dating from/i)).not.toBeInTheDocument();
  });

  it("does not request geolocation or Nominatim until the member acts", async () => {
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
    expect(urls.some((url) => isNominatimUrl(url))).toBe(false);
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

  it("preserves a saved area label when device location times out", async () => {
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

  it("debounces suburb search through Nominatim and saves coarse coordinates to PUT /profile/location", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    setBearerToken("opaque-session-token");
    const urls: string[] = [];
    let savedBody: Record<string, unknown> | undefined;
    let getAfterPut = false;
    mockFetch((url, init) => {
      urls.push(url);
      if (isNominatimUrl(url)) {
        return jsonResponse(200, [seaPointHit]);
      }
      if (url.endsWith("/api/v1/profile/location") && (init?.method ?? "GET") === "PUT") {
        savedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return jsonResponse(200, {
          location: {
            configured: true,
            accuracy_meters: 3000,
            source: "device",
            captured_at: "2026-08-27T04:00:00Z",
            place: null,
          },
        });
      }
      if (url.endsWith("/api/v1/profile/location") && (init?.method ?? "GET") === "GET") {
        getAfterPut = true;
        return jsonResponse(200, {
          location: {
            configured: true,
            accuracy_meters: 3000,
            source: "device",
            captured_at: "2026-08-27T04:00:00Z",
            place: null,
          },
        });
      }
      return jsonResponse(404, { error: "not_found" });
    });

    render(<DatingLocationPicker onSaved={onSaved} />);
    expect(urls.some((url) => isNominatimUrl(url))).toBe(false);
    await user.type(screen.getByRole("combobox", { name: /search suburb, city or area/i }), "sea");

    expect(await screen.findByText(/we found one match/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use sea point/i })).toBeInTheDocument();
    expect(screen.getByText("Cape Town, Western Cape, South Africa")).toBeInTheDocument();
    expect(urls.some((url) => isNominatimUrl(url))).toBe(true);
    expect(urls.some((url) => url.endsWith("/api/v1/profile/place"))).toBe(false);
    await user.click(screen.getByRole("button", { name: /use sea point/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(savedBody).toMatchObject({
      latitude: -33.9149,
      longitude: 18.3876,
      accuracy_meters: 3000,
    });
    expect(typeof savedBody?.captured_at).toBe("string");
    expect(getAfterPut).toBe(true);
    expect(screen.getByText("Dating from Sea Point, Cape Town, Western Cape, South Africa")).toBeInTheDocument();
  });

  it("corrects a common misspelling and shows results for Khayelitsha", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    mockFetch((url) => {
      if (!isNominatimUrl(url)) return jsonResponse(404, { error: "not_found" });
      if (url.includes("kayelitsha")) return jsonResponse(200, []);
      if (url.includes("Khayelitsha")) {
        return jsonResponse(200, [
          {
            lat: "-34.0405905",
            lon: "18.6674201",
            display_name: "Khayelitsha, City of Cape Town, Western Cape, South Africa",
          },
        ]);
      }
      return jsonResponse(200, []);
    });

    render(<DatingLocationPicker onSaved={vi.fn()} />);
    await user.type(screen.getByRole("combobox", { name: /search suburb, city or area/i }), "kayelitsha");

    expect(await screen.findByText(/showing results for khayelitsha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use khayelitsha/i })).toBeInTheDocument();
  });

  it("prompts members to choose from multiple suburb matches", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    mockFetch((url) => {
      if (isNominatimUrl(url)) {
        return jsonResponse(200, [
          seaPointHit,
          {
            lat: "-26.1076",
            lon: "28.0567",
            display_name: "Sandton, Johannesburg, Gauteng, South Africa",
          },
        ]);
      }
      return jsonResponse(404, { error: "not_found" });
    });

    render(<DatingLocationPicker onSaved={vi.fn()} />);
    await user.type(screen.getByRole("combobox", { name: /search suburb, city or area/i }), "sa");

    expect(await screen.findByText(/choose the area that matches you below/i)).toBeInTheDocument();
    expect(screen.getAllByText("Select").length).toBeGreaterThan(0);
    expect(screen.getByRole("option", { name: /sea point/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /sandton/i })).toBeInTheDocument();
  });

  it("shows a no-results state without inserting free text", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    mockFetch((url) => {
      if (isNominatimUrl(url)) return jsonResponse(200, []);
      return jsonResponse(404, { error: "not_found" });
    });

    render(<DatingLocationPicker onSaved={vi.fn()} />);
    await user.type(screen.getByRole("combobox"), "zzzzz");

    expect(await screen.findByText(/we couldn't find that area/i)).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("keeps current location available when area search fails", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    const urls: string[] = [];
    mockFetch((url) => {
      urls.push(url);
      if (isNominatimUrl(url)) return jsonResponse(503, { error: "busy" });
      return jsonResponse(404, { error: "not_found" });
    });

    render(
      <DatingLocationPicker savedLabel="Sandton, Johannesburg, Gauteng" onSaved={vi.fn()} />,
    );
    await user.type(screen.getByRole("combobox"), "sand");

    expect(await screen.findByText(/area search is temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use my current location/i })).toBeEnabled();
    expect(screen.getByText("Dating from Sandton, Johannesburg, Gauteng")).toBeInTheDocument();
    expect(urls.some((url) => isNominatimUrl(url))).toBe(true);
    expect(urls.some((url) => url.endsWith("/api/v1/places"))).toBe(false);
  });
});
