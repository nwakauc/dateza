import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";

/**
 * Discover and Find require a configured dating location from the server.
 * GET /profile `location.configured` is authoritative. When that field is
 * omitted, DateZA reads GET /api/v1/profile/location. Browser storage is not
 * consulted.
 */

const PROFILE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

const ownerProfile = {
  id: PROFILE_ID,
  brand: { slug: "dateza", name: "DateZA" },
  status: "active",
  visibility: "visible",
  options: {},
};

const completeOnboarding = {
  state: "complete",
  next_step: null,
  profile_exists: true,
  profile_complete: true,
  profile_published: true,
  completion: { complete: true, percent: 100, missing: [] },
};

function meBody() {
  return {
    user_id: 42,
    brand: { slug: "dateza", name: "DateZA" },
    session: { id: 7, expires_at: "2026-12-01T00:00:00Z" },
    identifier: { kind: "email", verified: true, masked_destination: "a••@example.com" },
    verification_required: false,
    verification: { code_dispatched: false, resend_available_in: 0 },
  };
}

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

function stubGeolocation(geolocation: Partial<Geolocation> | undefined) {
  Object.defineProperty(navigator, "geolocation", { value: geolocation, configurable: true });
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

function renderApp(path = "/discover") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function mockDiscoveryBackend(
  onDiscoveryCall: () => void,
  profile: Record<string, unknown> = ownerProfile,
  locationGet?: { configured: boolean },
) {
  vi.mocked(fetch).mockImplementation((input, init) => {
    const url = requestUrl(input);
    const method = init?.method ?? "GET";
    if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
    if (url.endsWith("/api/v1/profile")) {
      return Promise.resolve(jsonResponse(200, { profile, onboarding: completeOnboarding }));
    }
    if (url === "/api/v1/places" || url.startsWith("/api/v1/places?")) {
      return Promise.resolve(
        jsonResponse(200, {
          places: [{ id: 11, kind: "region", name: "Western Cape", code: "western-cape", has_children: true }],
        }),
      );
    }
    if (url.endsWith("/api/v1/profile/place") && method === "PUT") {
      return Promise.resolve(
        jsonResponse(200, {
          location: {
            configured: true,
            accuracy_meters: 8000,
            source: "place",
            captured_at: "2026-08-27T04:00:00Z",
            place: { id: 11, name: "Western Cape", display_path: "Western Cape" },
          },
        }),
      );
    }
    if (url.endsWith("/api/v1/profile/location") && method === "GET") {
      const configured = locationGet?.configured ?? false;
      return Promise.resolve(
        jsonResponse(200, {
          location: { configured, accuracy_meters: configured ? 25 : null, source: configured ? "place" : null, captured_at: null },
        }),
      );
    }
    if (url.endsWith("/api/v1/profile/location") && method === "PUT") {
      return Promise.resolve(
        jsonResponse(200, {
          location: { configured: true, accuracy_meters: 25, source: "device", captured_at: "2026-08-25T02:05:01Z" },
        }),
      );
    }
    if (url.endsWith("/api/v1/discovery")) {
      onDiscoveryCall();
      return Promise.resolve(
        jsonResponse(200, {
          profiles: [],
          next_cursor: null,
          selection: { allocation_date: "2026-08-24", daily_limit: 10, count: 0, finalized: true, refreshes_at: "2026-08-25T00:00:00+02:00" },
        }),
      );
    }
    return Promise.resolve(jsonResponse(404, { error: "not_found" }));
  });
}

describe("RequireLocation (historical-account Discover guard)", () => {
  afterEach(() => {
    stubGeolocation(undefined);
  });

  it("shows a location prompt instead of Discover when the server says location is not configured", async () => {
    setBearerToken("opaque-session-token");
    let discoveryCalls = 0;
    mockDiscoveryBackend(() => (discoveryCalls += 1), { ...ownerProfile, location: { configured: false } });

    renderApp();

    expect(await screen.findByRole("heading", { name: /where are you dating from/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: /^discover$/i })).not.toBeInTheDocument();
    expect(discoveryCalls).toBe(0);
  });

  it("reaches Discover after granting location through the guard's own prompt", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let discoveryCalls = 0;
    stubGeolocation({
      getCurrentPosition: (success) => {
        (success as PositionCallback)(successfulPosition());
      },
    });
    mockDiscoveryBackend(() => (discoveryCalls += 1), { ...ownerProfile, location: { configured: false } });

    renderApp();

    await screen.findByRole("heading", { name: /where are you dating from/i });
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByRole("heading", { level: 1, name: /^discover$/i })).toBeInTheDocument();
    expect(discoveryCalls).toBe(1);
  });

  it("does not call Discovery while permission is denied", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let discoveryCalls = 0;
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
    mockDiscoveryBackend(() => (discoveryCalls += 1), { ...ownerProfile, location: { configured: false } });

    renderApp();

    await screen.findByRole("heading", { name: /where are you dating from/i });
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/dateza needs a dating location/i)).toBeInTheDocument();
    expect(discoveryCalls).toBe(0);
  });

  it("skips the gate when GET /profile reports location.configured", async () => {
    setBearerToken("opaque-session-token");
    let discoveryCalls = 0;
    mockDiscoveryBackend(() => (discoveryCalls += 1), { ...ownerProfile, location: { configured: true } });

    renderApp();

    expect(await screen.findByRole("heading", { level: 1, name: /^discover$/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /where are you dating from/i })).not.toBeInTheDocument();
    expect(discoveryCalls).toBe(1);
  });

  it("uses GET /profile/location when GET /profile omits location, including on a new browser", async () => {
    setBearerToken("opaque-session-token");
    let discoveryCalls = 0;
    mockDiscoveryBackend(() => (discoveryCalls += 1), ownerProfile, { configured: true });

    renderApp();

    expect(await screen.findByRole("heading", { level: 1, name: /^discover$/i })).toBeInTheDocument();
    expect(discoveryCalls).toBe(1);
  });

  it("still prompts when GET /profile/location says location is not configured", async () => {
    setBearerToken("opaque-session-token");
    let discoveryCalls = 0;
    mockDiscoveryBackend(() => (discoveryCalls += 1), ownerProfile, { configured: false });

    renderApp();

    expect(await screen.findByRole("heading", { name: /where are you dating from/i })).toBeInTheDocument();
    expect(discoveryCalls).toBe(0);
  });
});
