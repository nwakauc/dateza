import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { markLocationConfirmed } from "../../lib/locationConfirmationStore.ts";
import { clearFindDeckMemory } from "./findDeckMemory.ts";

/**
 * FE-05: Find is a rich, sequential swipe experience — the deliberate
 * opposite of Discover's curated grid (see DiscoveryPage.test.tsx). A
 * Like/Pass is parked for a short undo grace window before the real
 * request is sent (D8N has no undo/rewind endpoint — see FindPage.tsx),
 * so several tests below advance past that window with a real `waitFor`
 * timeout rather than faking timers, to stay honest about what actually
 * fires the network request.
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

const emptyConfiguration = {
  configuration: { identity_fields: [], profile_fields: [], preference_fields: [], collections: [], option_groups: [] },
  onboarding: completeOnboarding,
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

function findProfile(overrides: Record<string, unknown> = {}) {
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
    job_title: null,
    school_or_institution: null,
    looking_for_text: null,
    height_cm: null,
    body_type: null,
    languages_spoken: [],
    smoking: null,
    drinking: null,
    fitness: null,
    photos: [{ id: "ph1", position: 0, url: "https://example.test/maya.jpg", url_expires_in: 3600 }],
    options: {},
    verified: true,
    online: false,
    active_today: false,
    new_here: false,
    last_active_at: null,
    distance_km: 3,
    compatibility: null,
    ...overrides,
  };
}

function allowance(overrides: Record<string, unknown> = {}) {
  return {
    limit: 10,
    used: 0,
    remaining: 10,
    exhausted: false,
    resets_at: "2026-08-25T00:00:00+02:00",
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

function renderApp(path = "/find") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function baseHandler(profiles: unknown[], allowanceBody: unknown, extra?: (url: string, method: string) => Response | undefined) {
  let discoveryCalls = 0;
  const fetchImpl = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = requestUrl(input);
    const method = methodOf(init);
    const extraResult = extra?.(url, method);
    if (extraResult) return Promise.resolve(extraResult);
    if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
    if (url.endsWith("/api/v1/profile")) {
      return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
    }
    if (url.endsWith("/api/v1/profile/configuration")) {
      return Promise.resolve(jsonResponse(200, emptyConfiguration));
    }
    if (url.endsWith("/api/v1/discovery")) {
      discoveryCalls += 1;
      return Promise.resolve(jsonResponse(404, { error: "matching_not_configured" }));
    }
    if (url.endsWith("/api/v1/find")) {
      return Promise.resolve(jsonResponse(200, { profiles, next_cursor: null, allowance: allowanceBody }));
    }
    if (url.endsWith("/api/v1/notifications")) {
      return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0, next_cursor: null }));
    }
    if (url.endsWith("/api/v1/conversations")) {
      return Promise.resolve(jsonResponse(200, { conversations: [], next_cursor: null }));
    }
    if (url.endsWith("/api/v1/profile/photos")) {
      return Promise.resolve(jsonResponse(200, { photos: [] }));
    }
    return Promise.resolve(jsonResponse(404, { error: "not_found" }));
  };
  return { fetchImpl, discoveryCallCount: () => discoveryCalls };
}

function findStackCard(): HTMLElement {
  const card = document.querySelector(".find-stack__active");
  if (!card) throw new Error("expected .find-stack__active to be present");
  return card as HTMLElement;
}

describe("Find (FE-05, rich swipe)", () => {
  beforeEach(() => {
    markLocationConfirmed(ownerProfile.id);
    clearFindDeckMemory();
  });

  it("renders exactly one active, actionable profile — not a grid", async () => {
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler(
      [findProfile({ id: "p1", display_name: "Maya" }), findProfile({ id: "p2", display_name: "Aisha" })],
      allowance(),
    );
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();

    expect(await screen.findByText("Maya")).toBeInTheDocument();
    expect(screen.queryByText("Aisha")).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /^like$/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /^pass$/i })).toHaveLength(1);
    expect(document.querySelector(".discover-grid")).not.toBeInTheDocument();
    expect(document.querySelector(".discovery-grid")).not.toBeInTheDocument();
  });

  it("shows Make your profile stand out with Complete profile when richness is below 100%", async () => {
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler(
      [findProfile({ id: "p1", display_name: "Maya" })],
      allowance(),
      (url) => {
        if (url.endsWith("/api/v1/profile")) {
          return jsonResponse(200, {
            profile: {
              ...ownerProfile,
              profile_completion: {
                percent: 72,
                level: "good",
                missing: ["interests"],
                suggestions: [{ key: "interests", label: "Add interests" }],
                sections: {},
              },
            },
            onboarding: completeOnboarding,
          });
        }
        return undefined;
      },
    );
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    expect(await screen.findByText(/make your profile stand out/i)).toBeInTheDocument();
    expect(screen.getByText("72% complete")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /complete profile/i })).toHaveAttribute("href", "/profile/edit");
  });

  it("does not simultaneously present the next candidate as actionable", async () => {
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler(
      [
        findProfile({ id: "p1", display_name: "Maya" }),
        findProfile({ id: "p2", display_name: "Aisha" }),
        findProfile({ id: "p3", display_name: "Zanele" }),
      ],
      allowance(),
    );
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");

    // Up to two peeks render behind the active card, but purely as
    // non-interactive, text-free photo silhouettes.
    const peeks = document.querySelectorAll(".find-stack__peek");
    expect(peeks.length).toBeGreaterThan(0);
    for (const peek of peeks) {
      expect(peek).toHaveAttribute("aria-hidden", "true");
      expect(peek.textContent).toBe("");
    }
  });

  it("shows a one-card skeleton while loading, not a grid of skeletons", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile/configuration")) return Promise.resolve(jsonResponse(200, emptyConfiguration));
      if (url.endsWith("/api/v1/find")) return new Promise(() => undefined);
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp();

    expect(await screen.findByRole("heading", { name: "Find" })).toBeInTheDocument();
    expect(document.querySelectorAll(".find-card-skeleton").length).toBeGreaterThan(0);
    expect(document.querySelector(".discover-grid")).not.toBeInTheDocument();
  });

  it("navigates multiple photos on the active card without triggering Like/Pass", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let likeCalls = 0;
    let passCalls = 0;
    const { fetchImpl } = baseHandler(
      [
        findProfile({
          id: "p1",
          display_name: "Maya",
          photos: [
            { id: "ph1", position: 0, url: "https://example.test/1.jpg", url_expires_in: 3600 },
            { id: "ph2", position: 1, url: "https://example.test/2.jpg", url_expires_in: 3600 },
          ],
        }),
      ],
      allowance(),
      (url, method) => {
        if (url.endsWith("/p1/likes") && method === "POST") {
          likeCalls += 1;
          return jsonResponse(200, { liked: true, matched: false, match_id: null, created: true });
        }
        if (url.endsWith("/p1/pass") && method === "POST") {
          passCalls += 1;
          return jsonResponse(200, { passed: true, created: true });
        }
        return undefined;
      },
    );
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    expect(screen.getByText("Photo 1 of 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next photo/i }));
    expect(screen.getByText("Photo 2 of 2")).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(likeCalls).toBe(0);
    expect(passCalls).toBe(0);
    expect(screen.getByText("Maya")).toBeInTheDocument();
  });

  it("keyboard users can activate Pass and Like", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let passCalls = 0;
    const { fetchImpl } = baseHandler([findProfile({ id: "p1", display_name: "Maya" })], allowance(), (url, method) => {
      if (url.endsWith("/p1/pass") && method === "POST") {
        passCalls += 1;
        return jsonResponse(200, { passed: true, created: true });
      }
      return undefined;
    });
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");

    screen.getByRole("button", { name: /^pass$/i }).focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("button", { name: /undo pass on maya/i })).toBeInTheDocument();
    await waitFor(() => expect(passCalls).toBe(1), { timeout: 4000 });
  }, 10000);

  it("a small drag snaps back without triggering Like or Pass", async () => {
    setBearerToken("opaque-session-token");
    let likeCalls = 0;
    let passCalls = 0;
    const { fetchImpl } = baseHandler([findProfile({ id: "p1", display_name: "Maya" })], allowance(), (url, method) => {
      if (url.endsWith("/p1/likes") && method === "POST") {
        likeCalls += 1;
        return jsonResponse(200, { liked: true, matched: false, match_id: null, created: true });
      }
      if (url.endsWith("/p1/pass") && method === "POST") {
        passCalls += 1;
        return jsonResponse(200, { passed: true, created: true });
      }
      return undefined;
    });
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    const card = findStackCard();

    fireEvent.pointerDown(card, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 220, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 220, pointerId: 1 });

    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(likeCalls).toBe(0);
    expect(passCalls).toBe(0);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("a committed rightward drag parks the card as Like, then commits after the undo window", async () => {
    setBearerToken("opaque-session-token");
    let likeCalls = 0;
    const { fetchImpl } = baseHandler(
      [findProfile({ id: "p1", display_name: "Maya" }), findProfile({ id: "p2", display_name: "Aisha" })],
      allowance(),
      (url, method) => {
        if (url.endsWith("/p1/likes") && method === "POST") {
          likeCalls += 1;
          return jsonResponse(200, { liked: true, matched: false, match_id: null, created: true });
        }
        return undefined;
      },
    );
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    const card = findStackCard();

    fireEvent.pointerDown(card, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 340, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 340, pointerId: 1 });

    expect(likeCalls).toBe(0);
    expect(await screen.findByRole("button", { name: /undo like on maya/i })).toBeInTheDocument();
    await waitFor(() => expect(likeCalls).toBe(1), { timeout: 4000 });
    expect(await screen.findByText("Aisha")).toBeInTheDocument();
  }, 10000);

  it("a committed leftward drag parks the card as Pass, then commits after the undo window", async () => {
    setBearerToken("opaque-session-token");
    let passCalls = 0;
    const { fetchImpl } = baseHandler(
      [findProfile({ id: "p1", display_name: "Maya" }), findProfile({ id: "p2", display_name: "Aisha" })],
      allowance(),
      (url, method) => {
        if (url.endsWith("/p1/pass") && method === "POST") {
          passCalls += 1;
          return jsonResponse(200, { passed: true, created: true });
        }
        return undefined;
      },
    );
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    const card = findStackCard();

    fireEvent.pointerDown(card, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 60, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 60, pointerId: 1 });

    expect(passCalls).toBe(0);
    expect(await screen.findByRole("button", { name: /undo pass on maya/i })).toBeInTheDocument();
    await waitFor(() => expect(passCalls).toBe(1), { timeout: 4000 });
    expect(await screen.findByText("Aisha")).toBeInTheDocument();
  }, 10000);

  it("Undo cancels the pending action before it is ever sent, restoring the active card", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let passCalls = 0;
    const { fetchImpl } = baseHandler([findProfile({ id: "p1", display_name: "Maya" })], allowance(), (url, method) => {
      if (url.endsWith("/p1/pass") && method === "POST") {
        passCalls += 1;
        return jsonResponse(200, { passed: true, created: true });
      }
      return undefined;
    });
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    await user.click(screen.getByRole("button", { name: /^pass$/i }));
    await user.click(await screen.findByRole("button", { name: /undo pass on maya/i }));

    await new Promise((resolve) => setTimeout(resolve, 2500));
    expect(passCalls).toBe(0);
    expect(screen.getByText("Maya")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^pass$/i })).not.toBeDisabled();
  }, 10000);

  it("a match keeps the profile visible and requires Continue instead of auto-advancing", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler(
      [findProfile({ id: "p1", display_name: "Maya" }), findProfile({ id: "p2", display_name: "Aisha" })],
      allowance(),
      (url, method) => {
        if (url.endsWith("/p1/likes") && method === "POST") {
          return jsonResponse(200, { liked: true, matched: true, match_id: "m1", created: true });
        }
        return undefined;
      },
    );
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    await user.click(screen.getByRole("button", { name: /^like$/i }));

    expect(await screen.findByText(/you matched with maya/i, {}, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText("Maya")).toBeInTheDocument();
    expect(screen.queryByText("Aisha")).not.toBeInTheDocument();

    const matchDialog = screen.getByRole("dialog", { name: /it's a match!/i });
    await user.click(within(matchDialog).getByRole("button", { name: /keep discovering|keep finding/i }));
    expect(await screen.findByText("Aisha")).toBeInTheDocument();
  }, 10000);

  it("a failed Like leaves the card active and recoverable", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler([findProfile({ id: "p1", display_name: "Maya" })], allowance(), (url, method) => {
      if (url.endsWith("/p1/likes") && method === "POST") {
        return jsonResponse(500, { error: "server_error" });
      }
      return undefined;
    });
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    await user.click(screen.getByRole("button", { name: /^like$/i }));

    expect(await screen.findByRole("alert", {}, { timeout: 4000 })).toHaveTextContent(/couldn't save/i);
    expect(screen.getByText("Maya")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^like$/i })).not.toBeDisabled();
  }, 10000);

  it("opens profile detail from Find and Back to Find returns to Find, not Discover", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler([findProfile({ id: "p1", display_name: "Maya" })], allowance(), (url) => {
      if (url.endsWith("/api/v1/profiles/p1")) {
        return jsonResponse(200, {
          profile: {
            ...findProfile({ id: "p1", display_name: "Maya" }),
            hook_tonight_active: false,
            hook_state: "unavailable",
            prompts: [],
            interests: [],
          },
        });
      }
      return undefined;
    });
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    await user.click(screen.getByRole("button", { name: /open maya's full profile/i }));

    expect(await screen.findByRole("link", { name: /back to find/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /back to discover/i })).not.toBeInTheDocument();
  });

  it("gates an unverified member's Like through the existing verification flow instead of calling the API", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let likeCalls = 0;
    const fetchImpl = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      const method = methodOf(init);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(
          jsonResponse(
            200,
            meBody({
              identifier: { kind: "email", verified: false, masked_destination: "a••@example.com" },
              verification_required: true,
            }),
          ),
        );
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile/configuration")) return Promise.resolve(jsonResponse(200, emptyConfiguration));
      if (url.endsWith("/api/v1/find")) {
        return Promise.resolve(
          jsonResponse(200, { profiles: [findProfile({ id: "p1", display_name: "Maya" })], next_cursor: null, allowance: allowance() }),
        );
      }
      if (url.endsWith("/p1/likes") && method === "POST") {
        likeCalls += 1;
        return Promise.resolve(jsonResponse(200, { liked: true, matched: false, match_id: null, created: true }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    };
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    expect(await screen.findByRole("dialog", { name: /verify your email/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /not now/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    await screen.findByText("Maya");
    await user.click(screen.getByRole("button", { name: /^like$/i }));

    expect(await screen.findByRole("dialog", { name: /verify your account/i })).toBeInTheDocument();
    expect(likeCalls).toBe(0);
  });

  it("shows an intentional exhausted state when the daily allowance is spent", async () => {
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler([], allowance({ remaining: 0, exhausted: true }));
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();

    expect(await screen.findByText(/you've seen today's find picks/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore discover/i })).toHaveAttribute("href", "/discover");
  });

  it("shows an intentional empty state, distinct from exhausted, when nothing is eligible", async () => {
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler([], allowance({ remaining: 10, exhausted: false }));
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();

    expect(await screen.findByText(/no one new right now/i)).toBeInTheDocument();
    expect(screen.queryByText(/that's everyone for today/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/you've seen today's find picks/i)).not.toBeInTheDocument();
  });

  it("never calls /api/v1/discovery", async () => {
    setBearerToken("opaque-session-token");
    const { fetchImpl, discoveryCallCount } = baseHandler([findProfile({ id: "p1", display_name: "Maya" })], allowance());
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");

    expect(discoveryCallCount()).toBe(0);
  });

  it("celebrates a mutual match with a modal whose Message action opens the real conversation, not a fabricated opener", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let conversationCalls = 0;
    const { fetchImpl } = baseHandler([findProfile({ id: "p1", display_name: "Maya" })], allowance(), (url, method) => {
      if (url.endsWith("/p1/likes") && method === "POST") {
        return jsonResponse(200, { liked: true, matched: true, match_id: "m1", created: true });
      }
      if (url.endsWith("/api/v1/matches/m1/conversation") && method === "POST") {
        conversationCalls += 1;
        return jsonResponse(200, {
          conversation: { id: "c1", match_id: "m1", status: "active", created_at: "2026-08-24T00:00:00Z", profile: findProfile({ id: "p1", display_name: "Maya" }), last_message: null },
        });
      }
      if (url.endsWith("/api/v1/conversations")) return jsonResponse(200, { conversations: [], next_cursor: null });
      return undefined;
    });
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    await user.click(screen.getByRole("button", { name: /^like$/i }));

    expect(await screen.findByRole("dialog", { name: /it's a match!/i }, { timeout: 4000 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /message maya/i }));

    expect(await screen.findByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(conversationCalls).toBe(1);
  }, 10000);

  it("shows a desktop side panel backed by real compatibility, lifestyle, and interest data", async () => {
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler(
      [
        findProfile({
          id: "p1",
          display_name: "Maya",
          job_title: "Marketing Manager",
          smoking: "never",
          options: { interests: ["hiking", "coffee"] },
          compatibility: { score: 87, confidence: 0.8, confidence_level: "high", version: "dateza_v1", reasons: ["shared_long_term_intent", "compatible_family_plans"] },
        }),
      ],
      allowance(),
    );
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(
          jsonResponse(200, {
            configuration: {
              identity_fields: [],
              profile_fields: [],
              preference_fields: [],
              collections: [],
              option_groups: [{ key: "interests", label: "Interests", cardinality: "multiple", max_selections: 5, required: false, visibility: "public", options: [
                { code: "hiking", label: "Hiking" },
                { code: "coffee", label: "Coffee" },
              ] }],
            },
            onboarding: completeOnboarding,
          }),
        );
      }
      return fetchImpl(input, init);
    });

    renderApp();
    await screen.findByText("Maya");

    expect(await screen.findByText("Why you're compatible")).toBeInTheDocument();
    expect(screen.getByText("Both want long-term")).toBeInTheDocument();
    expect(screen.getByText("About Maya")).toBeInTheDocument();
    expect(screen.getByText("Marketing Manager")).toBeInTheDocument();
    expect(screen.getByText("Never smoked")).toBeInTheDocument();
    expect(screen.getByText("Interests")).toBeInTheDocument();
    expect(screen.getAllByText("Hiking").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Coffee").length).toBeGreaterThan(0);
  });

  it("still offers a full-profile path when the profile has no extra context", async () => {
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler([findProfile({ id: "p1", display_name: "Maya" })], allowance());
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");

    expect(screen.queryByText("Why you're compatible")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view full profile/i })).toBeInTheDocument();
  });

  it("shows the opener composer and keeps the draft when the opener API is unavailable", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler([findProfile({ id: "p1", display_name: "Maya" })], allowance());
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    await screen.findByText("Maya");
    const field = screen.getByLabelText(/opener message/i);
    await user.type(field, "Coffee this weekend?");
    await user.click(document.querySelector(".find-opener-form__icon-send") as HTMLButtonElement);

    expect(await screen.findByRole("alert")).toHaveTextContent(/aren’t on DateZA|aren't on DateZA/i);
    expect(field).toHaveValue("Coffee this weekend?");
    expect(screen.queryByText(/your opener was sent/i)).not.toBeInTheDocument();
  });

  it("renders product notices in Recent activity without inventing profile views", async () => {
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler([findProfile({ id: "p1", display_name: "Maya" })], allowance(), (url) => {
      if (url.endsWith("/api/v1/notifications")) {
        return jsonResponse(200, {
          notifications: [
            {
              id: "n1",
              type: "dateza.welcome",
              title: "Welcome to DateZA",
              body: "Your profile is live.",
              read_at: null,
              created_at: "2026-08-26T00:00:00Z",
            },
          ],
          unread_count: 1,
        });
      }
      return undefined;
    });
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    expect(await screen.findByText("Welcome to DateZA")).toBeInTheDocument();
    expect(screen.queryByText(/viewed your profile/i)).not.toBeInTheDocument();
  });

  it("shows a prompt from public profile detail when Find itself has none", async () => {
    setBearerToken("opaque-session-token");
    const { fetchImpl } = baseHandler([findProfile({ id: "p1", display_name: "Maya", pronouns: "she/her" })], allowance(), (url) => {
      if (url.endsWith("/api/v1/profiles/p1")) {
        return jsonResponse(200, {
          profile: {
            ...findProfile({ id: "p1", display_name: "Maya", pronouns: "she/her" }),
            hook_tonight_active: false,
            hook_state: "unavailable",
            prompts: [{ key: "dessert", prompt: "The way to my heart", answer: "Good conversations and even better dessert.", position: 0 }],
            interests: [],
          },
        });
      }
      return undefined;
    });
    vi.mocked(fetch).mockImplementation(fetchImpl);

    renderApp();
    expect(await screen.findByText("Her prompt")).toBeInTheDocument();
    expect(screen.getByText("Good conversations and even better dessert.")).toBeInTheDocument();
  });
});
