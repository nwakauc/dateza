import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { hasConfirmedLocation, markLocationConfirmed } from "../../lib/locationConfirmationStore.ts";

/**
 * D8N's GET /api/v1/profile does not expose whether ProfileLocation is
 * configured, so this guard can only act on what this device has itself
 * confirmed (see locationConfirmationStore.ts) — these tests cover accounts
 * published before location capture existed, reaching /discover directly
 * without ever going through the onboarding LocationStep in this session.
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

function mockDiscoveryBackend(onDiscoveryCall: () => void) {
  vi.mocked(fetch).mockImplementation((input, init) => {
    const url = requestUrl(input);
    const method = init?.method ?? "GET";
    if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
    if (url.endsWith("/api/v1/profile")) {
      return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
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

  it("shows a location prompt instead of Discover for a published account this device has never confirmed", async () => {
    setBearerToken("opaque-session-token");
    let discoveryCalls = 0;
    mockDiscoveryBackend(() => (discoveryCalls += 1));

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
    mockDiscoveryBackend(() => (discoveryCalls += 1));

    renderApp();

    await screen.findByRole("heading", { name: /where are you dating from/i });
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByRole("heading", { level: 1, name: /^discover$/i })).toBeInTheDocument();
    expect(discoveryCalls).toBe(1);
    expect(hasConfirmedLocation(PROFILE_ID)).toBe(true);
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
    mockDiscoveryBackend(() => (discoveryCalls += 1));

    renderApp();

    await screen.findByRole("heading", { name: /where are you dating from/i });
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/dateza needs your location/i)).toBeInTheDocument();
    expect(discoveryCalls).toBe(0);
  });

  it("skips straight to Discover when this device already confirmed location for this profile", async () => {
    setBearerToken("opaque-session-token");
    markLocationConfirmed(PROFILE_ID);
    let discoveryCalls = 0;
    mockDiscoveryBackend(() => (discoveryCalls += 1));

    renderApp();

    expect(await screen.findByRole("heading", { level: 1, name: /^discover$/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /where are you dating from/i })).not.toBeInTheDocument();
    expect(discoveryCalls).toBe(1);
  });
});
