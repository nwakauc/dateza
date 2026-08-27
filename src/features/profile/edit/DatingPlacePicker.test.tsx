import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DatingPlacePicker } from "./DatingPlacePicker.tsx";
import { setBearerToken } from "../../../lib/api/tokenStore.ts";
import { hasConfirmedLocation } from "../../../lib/locationConfirmationStore.ts";

const PROFILE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

const westernCape = {
  id: 11,
  kind: "region",
  name: "Western Cape",
  code: "western-cape",
  has_children: true,
};

const gauteng = {
  id: 12,
  kind: "region",
  name: "Gauteng",
  code: "gauteng",
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

const placeSaveResponse = {
  location: {
    configured: true,
    accuracy_meters: 5000,
    source: "place",
    captured_at: "2026-08-27T04:00:00Z",
    place: { id: 31, name: "Sea Point", display_path: "Sea Point, Cape Town, Western Cape" },
  },
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

function placesBody(url: string): { places: typeof westernCape[] } {
  const parentId = new URL(url, "https://dateza.test").searchParams.get("parent_id");
  if (parentId === "11") return { places: [capeTown] };
  if (parentId === "21") return { places: [seaPoint] };
  return { places: [westernCape, gauteng] };
}

describe("DatingPlacePicker", () => {
  it("loads D8N places, drills the returned hierarchy, and saves the selected place_id", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    setBearerToken("opaque-session-token");
    let savedBody: Record<string, unknown> | undefined;
    const requested: string[] = [];
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      requested.push(`${init?.method ?? "GET"} ${url}`);
      if (url.includes("nominatim.openstreetmap.org")) {
        return Promise.resolve(jsonResponse(500, { error: "geocoder_should_not_run" }));
      }
      if (isPlacesUrl(url)) {
        return Promise.resolve(jsonResponse(200, placesBody(url)));
      }
      if (url.endsWith("/api/v1/profile/place") && (init?.method ?? "GET") === "PUT") {
        savedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return Promise.resolve(jsonResponse(200, placeSaveResponse));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    render(<DatingPlacePicker profileId={PROFILE_ID} onSaved={onSaved} />);

    expect(await screen.findByRole("button", { name: "Western Cape" })).toBeInTheDocument();
    expect(requested.some((item) => item.includes("nominatim"))).toBe(false);
    await user.click(screen.getByRole("button", { name: "Western Cape" }));
    expect(await screen.findByRole("button", { name: "Cape Town" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cape Town" }));
    await user.click(await screen.findByRole("button", { name: /use sea point/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(savedBody).toEqual({ place_id: 31 });
    expect(screen.getByText("Dating from Sea Point, Cape Town, Western Cape")).toBeInTheDocument();
    expect(hasConfirmedLocation(PROFILE_ID)).toBe(true);
    expect(requested.some((item) => item.includes("nominatim"))).toBe(false);
    expect(onSaved.mock.calls[0]?.[0]).toMatchObject({
      configured: true,
      place: { id: 31, display_path: "Sea Point, Cape Town, Western Cape" },
    });
  });

  it("does not claim success until PUT /profile/place succeeds, and keeps the error retryable", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    setBearerToken("opaque-session-token");
    let finishSave: ((value: Response) => void) | undefined;
    let putCount = 0;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      if (isPlacesUrl(url)) {
        return Promise.resolve(jsonResponse(200, placesBody(url)));
      }
      if (url.endsWith("/api/v1/profile/place") && (init?.method ?? "GET") === "PUT") {
        putCount += 1;
        if (putCount === 1) {
          return new Promise((resolve) => {
            finishSave = resolve;
          });
        }
        return Promise.resolve(jsonResponse(200, {
          location: {
            configured: true,
            accuracy_meters: 8000,
            source: "place",
            captured_at: "2026-08-27T04:00:00Z",
            place: { id: 11, name: "Western Cape", display_path: "Western Cape" },
          },
        }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    render(<DatingPlacePicker profileId={PROFILE_ID} onSaved={onSaved} />);
    const useWesternCape = await screen.findByRole("button", { name: /use western cape as dating location/i });
    await user.click(useWesternCape);

    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
    expect(screen.queryByText(/dating from/i)).not.toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();

    finishSave?.(jsonResponse(422, { error: "invalid_place" }));
    expect(await screen.findByText(/that area isn't available/i)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.queryByText(/dating from/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /use western cape as dating location/i }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Dating from Western Cape")).toBeInTheDocument();
  });
});
