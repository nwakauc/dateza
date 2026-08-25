import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationStep } from "./LocationStep.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { hasConfirmedLocation } from "../../lib/locationConfirmationStore.ts";

const PROFILE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

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

afterEach(() => {
  stubGeolocation(undefined);
});

describe("LocationStep", () => {
  it("does not request geolocation on mount, only after the member acts", async () => {
    const getCurrentPosition = vi.fn();
    stubGeolocation({ getCurrentPosition });
    setBearerToken("opaque-session-token");

    render(<LocationStep profileId={PROFILE_ID} onSuccess={vi.fn()} />);

    expect(screen.getByRole("button", { name: /use my current location/i })).toBeInTheDocument();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("maps a successful fix to PUT /api/v1/profile/location and calls onSuccess once D8N confirms it", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    setBearerToken("opaque-session-token");
    let requestBody: Record<string, unknown> | undefined;
    stubGeolocation({
      getCurrentPosition: (success) => {
        (success as PositionCallback)(successfulPosition());
      },
    });
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/profile/location") && (init?.method ?? "GET") === "PUT") {
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return Promise.resolve(
          jsonResponse(200, {
            location: { configured: true, accuracy_meters: 25, source: "device", captured_at: "2026-08-25T02:05:01Z" },
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={onSuccess} />);
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

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
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(jsonResponse(404, { error: "not_found" })));

    render(<LocationStep profileId={PROFILE_ID} onSuccess={onSuccess} />);
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/dateza needs your location/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(hasConfirmedLocation(PROFILE_ID)).toBe(false);
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("distinguishes position-unavailable from timeout with different copy", async () => {
    const user = userEvent.setup();
    stubGeolocation({
      getCurrentPosition: (_success, error) => {
        (error as PositionErrorCallback)({ code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, message: "unavailable" } as GeolocationPositionError);
      },
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/couldn't work out your location/i)).toBeInTheDocument();
  });

  it("shows unsupported guidance and disables the action when the browser has no geolocation API", () => {
    stubGeolocation(undefined);

    render(<LocationStep profileId={PROFILE_ID} onSuccess={vi.fn()} />);
    const button = screen.getByRole("button", { name: /use my current location/i });
    fireEvent.click(button);

    expect(screen.getByText(/doesn't support location sharing/i)).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it("shows a field-level message and does not call onSuccess when D8N rejects the fix", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    stubGeolocation({
      getCurrentPosition: (success) => {
        (success as PositionCallback)(successfulPosition());
      },
    });
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/profile/location")) {
        return Promise.resolve(
          jsonResponse(422, { error: "invalid_location", details: { latitude: ["must be less than or equal to 90"] } }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={onSuccess} />);
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/must be less than or equal to 90/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("does not start a second geolocation request while one is already in flight", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn();
    stubGeolocation({ getCurrentPosition });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={vi.fn()} />);
    const button = screen.getByRole("button", { name: /use my current location/i });
    await user.click(button);
    await user.click(button);
    await user.click(button);

    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("treats an explicit configured:false as incomplete rather than success", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    stubGeolocation({
      getCurrentPosition: (success) => {
        (success as PositionCallback)(successfulPosition());
      },
    });
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/profile/location")) {
        return Promise.resolve(jsonResponse(200, { location: { configured: false, accuracy_meters: null, source: null, captured_at: null } }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    render(<LocationStep profileId={PROFILE_ID} onSuccess={onSuccess} />);
    await user.click(screen.getByRole("button", { name: /use my current location/i }));

    expect(await screen.findByText(/couldn't confirm your location/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
