import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { markLocationConfirmed } from "../../lib/locationConfirmationStore.ts";

/**
 * FE-02: Discover's real `/api/v1/discovery` integration. Discover and Find
 * are separate products/allowances (see project memory) — these tests
 * assert the endpoint separation explicitly, alongside the curated-batch
 * semantics (no "remaining" framing, no client-side refill) and the FE-01
 * verification gate staying intact for Discover's own interactions.
 */

const ownerProfile = {
  id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
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

function meBody(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 42,
    brand: { slug: "dateza", name: "DateZA" },
    session: { id: 7, expires_at: "2026-12-01T00:00:00Z" },
    identifier: { kind: "email", verified: true, masked_destination: "a••@example.com" },
    verification_required: false,
    verification: { code_dispatched: false, resend_available_in: 0 },
    ...overrides,
  };
}

function discoveryProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    display_name: "Maya",
    age: 27,
    bio: "Marketing manager who loves hikes.",
    gender: "female",
    pronouns: null,
    country_code: "ZA",
    city: "Cape Town",
    occupation: null,
    job_title: "Marketing manager",
    school_or_institution: null,
    looking_for_text: null,
    height_cm: null,
    body_type: null,
    languages_spoken: ["English"],
    smoking: null,
    drinking: null,
    fitness: null,
    photos: [{ id: "ph1", position: 0, url: "https://example.test/maya.jpg", url_expires_in: 3600 }],
    options: {},
    verified: true,
    online: true,
    active_today: true,
    new_here: false,
    last_active_at: null,
    distance_km: 3,
    compatibility: {
      score: 92,
      confidence: 0.9,
      confidence_level: "high",
      version: "dateza_v1",
      reasons: ["shared_long_term_intent", "shared_interests"],
    },
    ...overrides,
  };
}

function selection(overrides: Record<string, unknown> = {}) {
  return {
    allocation_date: "2026-08-24",
    daily_limit: 10,
    count: 2,
    finalized: true,
    refreshes_at: "2026-08-25T00:00:00+02:00",
    ...overrides,
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

function methodOf(init?: RequestInit): string {
  return init?.method ?? "GET";
}

function renderApp(path = "/discover") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("Discover (FE-02)", () => {
  // These tests are about Discover's own request/rendering behaviour, not
  // the location guard (covered separately in RequireLocation.test.tsx) —
  // seed the device as already having confirmed location so it doesn't
  // intercept every test here.
  beforeEach(() => {
    markLocationConfirmed(ownerProfile.id);
  });

  it("requests GET /api/v1/discovery and never requests /api/v1/find", async () => {
    setBearerToken("opaque-session-token");
    let discoveryCalls = 0;
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile")) return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      if (url.includes("/api/v1/find")) throw new Error("must not request Find from Discovery");
      if (url.endsWith("/api/v1/discovery")) {
        discoveryCalls += 1;
        return Promise.resolve(
          jsonResponse(200, {
            profiles: [discoveryProfile(), discoveryProfile({ id: "p2", display_name: "Aisha", verified: false })],
            next_cursor: null,
            selection: selection(),
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp();

    expect(await screen.findByRole("heading", { name: /picked for you today/i })).toBeInTheDocument();
    expect(await screen.findByText("Maya")).toBeInTheDocument();
    expect(discoveryCalls).toBe(1);
  });

  it("renders profiles in backend order", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile")) return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(
          jsonResponse(200, {
            profiles: [
              discoveryProfile({ id: "p2", display_name: "Aisha" }),
              discoveryProfile({ id: "p1", display_name: "Maya" }),
            ],
            next_cursor: null,
            selection: selection(),
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp();

    const cards = await screen.findAllByRole("button", { name: /open .*'s profile/i });
    expect(cards.map((card) => card.getAttribute("aria-label"))).toEqual([
      "Open Aisha's profile",
      "Open Maya's profile",
    ]);
  });

  it("renders the compatibility score without presenting selection.count as a remaining allowance", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile")) return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(
          jsonResponse(200, { profiles: [discoveryProfile()], next_cursor: null, selection: selection({ count: 1 }) }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp();

    expect(await screen.findByText("92% compatible")).toBeInTheDocument();
    expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bleft\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1\s*\/\s*10/)).not.toBeInTheDocument();
  });

  it("uses refreshes_at for the refresh message, and renders a partial batch normally", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile")) return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      if (url.endsWith("/api/v1/discovery")) {
        // Partial batch: only 3 of a possible 10.
        return Promise.resolve(
          jsonResponse(200, {
            profiles: [discoveryProfile(), discoveryProfile({ id: "p2" }), discoveryProfile({ id: "p3" })],
            next_cursor: null,
            selection: selection({ count: 3, daily_limit: 10 }),
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp();

    expect(await screen.findAllByText("Maya")).toHaveLength(3);
    expect(screen.getByText(/New picks/i)).toBeInTheDocument();
    expect(screen.queryByText(/could not find|couldn't find all|failed to find/i)).not.toBeInTheDocument();
  });

  it("shows a polished empty state, offers Find as a secondary action, and does not auto-redirect", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile")) return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(
          jsonResponse(200, { profiles: [], next_cursor: null, selection: selection({ count: 0 }) }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp();

    expect(await screen.findByText(/no picks right now/i)).toBeInTheDocument();
    const findLink = screen.getByRole("link", { name: /browse find instead/i });
    expect(findLink).toHaveAttribute("href", "/find");
  });

  it("shows a retry state on failure and renders results after a successful retry", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let discoveryCalls = 0;
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile")) return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      if (url.endsWith("/api/v1/discovery")) {
        discoveryCalls += 1;
        if (discoveryCalls === 1) return Promise.resolve(jsonResponse(500, { error: "server_error" }));
        return Promise.resolve(
          jsonResponse(200, { profiles: [discoveryProfile()], next_cursor: null, selection: selection({ count: 1 }) }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp();

    expect(await screen.findByText(/we couldn't load your picks/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("Maya")).toBeInTheDocument();
    expect(discoveryCalls).toBe(2);
  });

  it("updates Like/Pass in place without fabricating a replacement card", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let likeCalls = 0;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = methodOf(init);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile")) return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(
          jsonResponse(200, {
            profiles: [discoveryProfile(), discoveryProfile({ id: "p2", display_name: "Aisha" })],
            next_cursor: null,
            selection: selection(),
          }),
        );
      }
      if (url.endsWith("/p1/likes") && method === "POST") {
        likeCalls += 1;
        return Promise.resolve(jsonResponse(200, { liked: true, matched: true, match_id: "m1", created: true }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp();

    await screen.findByText("Maya");
    const mayaCard = screen.getByRole("button", { name: /open maya's profile/i }).closest("article")!;
    await user.click(within(mayaCard).getByRole("button", { name: /^like$/i }));

    await waitFor(() => expect(within(mayaCard).getByText(/it's a match!/i)).toBeInTheDocument());
    expect(likeCalls).toBe(1);

    // Exactly the original two cards remain — no client-side refill.
    expect(screen.getAllByRole("button", { name: /open .*'s profile/i })).toHaveLength(2);
    expect(screen.getByText("Aisha")).toBeInTheDocument();
  });

  it("gates an unverified member's Like through the existing verification flow instead of calling the API", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let likeCalls = 0;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = methodOf(init);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(
          jsonResponse(
            200,
            meBody({
              identifier: { kind: "email", verified: false, masked_destination: "a••@example.com" },
              verification_required: true,
              verification: { code_dispatched: false, resend_available_in: 0 },
            }),
          ),
        );
      }
      if (url.endsWith("/api/v1/profile")) return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(
          jsonResponse(200, { profiles: [discoveryProfile()], next_cursor: null, selection: selection({ count: 1 }) }),
        );
      }
      if (url.endsWith("/likes") && method === "POST") {
        likeCalls += 1;
        return Promise.resolve(jsonResponse(200, { liked: true, matched: false, match_id: null, created: true }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp();

    // FE-01's own auto-open modal fires first (onboarding complete + unverified).
    expect(await screen.findByRole("dialog", { name: /verify your email/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /not now/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /^like$/i }));

    expect(await screen.findByRole("dialog", { name: /verify your account/i })).toBeInTheDocument();
    expect(likeCalls).toBe(0);
  });
});
