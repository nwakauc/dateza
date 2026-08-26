import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { markLocationConfirmed } from "../../lib/locationConfirmationStore.ts";

const ownerProfile = {
  id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  brand: { slug: "dateza", name: "DateZA" },
  status: "active",
  visibility: "visible",
  options: {},
  display_name: "Thando",
  profile_completion: {
    percent: 70,
    level: "building",
    missing: ["prompts"],
    suggestions: [
      { key: "more_photos", label: "Add more photos" },
      { key: "prompt", label: "Answer a prompt" },
    ],
    sections: {},
  },
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

function publicProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    display_name: "Maya",
    age: 27,
    bio: null,
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
    languages_spoken: ["English"],
    smoking: null,
    drinking: null,
    fitness: null,
    photos: [{ id: "ph1", position: 0, url: "https://example.test/maya.jpg", url_expires_in: 3600 }],
    options: { relationship_intent: ["long_term_relationship"] },
    ...overrides,
  };
}

function matchBody(overrides: Record<string, unknown> = {}) {
  return {
    id: "m1",
    matched_at: "2026-08-26T10:00:00Z",
    profile: publicProfile(),
    ...overrides,
  };
}

function conversationBody(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    match_id: "m1",
    status: "active",
    created_at: "2026-08-26T10:05:00Z",
    profile: publicProfile(),
    last_message: null,
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
  return (init?.method ?? "GET").toUpperCase();
}

function renderLikes(path = "/likes") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function baseHandler(extra?: (url: string, method: string) => Response | undefined) {
  const fetchImpl = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = requestUrl(input);
    const method = methodOf(init);
    const extraResult = extra?.(url, method);
    if (extraResult) return Promise.resolve(extraResult);
    if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
    if (url.endsWith("/api/v1/profile")) {
      return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
    }
    if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
    if (url.endsWith("/api/v1/notifications")) {
      return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0, next_cursor: null }));
    }
    if (url.endsWith("/api/v1/profile/configuration")) {
      return Promise.resolve(
        jsonResponse(200, {
          configuration: {
            identity_fields: [],
            profile_fields: [],
            preference_fields: [],
            collections: [],
            option_groups: [
              {
                key: "relationship_intent",
                label: "Looking for",
                cardinality: "single",
                max_selections: 1,
                required: true,
                visibility: "public_profile",
                options: [{ code: "long_term_relationship", label: "Long-term relationship" }],
              },
            ],
          },
          onboarding: completeOnboarding,
        }),
      );
    }
    if (url.includes("/api/v1/matches") && method === "GET" && !url.includes("/conversation")) {
      return Promise.resolve(jsonResponse(200, { matches: [matchBody()], next_cursor: null }));
    }
    if (url.endsWith("/api/v1/conversations")) {
      return Promise.resolve(jsonResponse(200, { conversations: [], next_cursor: null }));
    }
    return Promise.resolve(jsonResponse(404, { error: "not_found" }));
  };
  return fetchImpl;
}

describe("Likes hub", () => {
  beforeEach(() => {
    markLocationConfirmed(ownerProfile.id);
  });

  it("loads GET /api/v1/matches and never invents an incoming-likes endpoint", async () => {
    setBearerToken("opaque-session-token");
    const urls: string[] = [];
    vi.mocked(fetch).mockImplementation((input, init) => {
      urls.push(requestUrl(input));
      return Promise.resolve(baseHandler()(input, init));
    });

    renderLikes();

    expect(await screen.findByRole("heading", { level: 1, name: /likes/i })).toBeInTheDocument();
    expect(await screen.findByText("Maya")).toBeInTheDocument();
    expect(screen.getByText("Cape Town")).toBeInTheDocument();
    expect(screen.getByText("Matched")).toBeInTheDocument();
    expect(urls.some((url) => url.includes("/api/v1/matches"))).toBe(true);
    expect(urls.some((url) => /\/api\/v1\/likes(\?|$)/.test(url))).toBe(false);
    expect(urls.some((url) => url.includes("incoming"))).toBe(false);
    expect(screen.queryByText("78")).not.toBeInTheDocument();
    expect(screen.queryByText(/recent visitors/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /boost profile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upgrade/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/lerato/i)).not.toBeInTheDocument();
  });

  it("shows an authoritative mutual count only when the match list is complete", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation(baseHandler());

    renderLikes();

    expect(await screen.findByRole("tab", { name: /mutual, 1/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /mutual likes/i })).toBeInTheDocument();
  });

  it("does not treat a paginated page length as a total count", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation(
      baseHandler((url, method) => {
        if (url.includes("/api/v1/matches") && method === "GET" && !url.includes("/conversation")) {
          return jsonResponse(200, { matches: [matchBody()], next_cursor: "cursor-2" });
        }
        return undefined;
      }),
    );

    renderLikes();

    expect(await screen.findByText("Maya")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^mutual$/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /mutual, 1/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /see more/i })).toBeInTheDocument();
  });

  it("paginates matches with the server cursor", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    const matchUrls: string[] = [];
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = methodOf(init);
      if (url.includes("/api/v1/matches") && method === "GET" && !url.includes("/conversation")) {
        matchUrls.push(url);
        if (url.includes("cursor=")) {
          return Promise.resolve(
            jsonResponse(200, {
              matches: [matchBody({ id: "m2", profile: publicProfile({ id: "p2", display_name: "Aisha" }) })],
              next_cursor: null,
            }),
          );
        }
        return Promise.resolve(jsonResponse(200, { matches: [matchBody()], next_cursor: "abc" }));
      }
      return Promise.resolve(baseHandler()(input, init));
    });

    renderLikes();
    expect(await screen.findByText("Maya")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /see more/i }));
    expect(await screen.findByText("Aisha")).toBeInTheDocument();
    expect(matchUrls.some((url) => url.includes("cursor=abc"))).toBe(true);
  });

  it("opens a rich profile from photo and name, then Back to Likes", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation(
      baseHandler((url) => {
        if (url.endsWith("/api/v1/profiles/p1")) {
          return jsonResponse(200, {
            profile: {
              ...publicProfile(),
              verified: true,
              online: false,
              active_today: false,
              new_here: false,
              last_active_at: null,
              distance_km: 3,
              hook_tonight_active: false,
              hook_state: "unavailable",
              prompts: [],
              interests: [],
              compatibility: null,
            },
          });
        }
        return undefined;
      }),
    );

    renderLikes();
    expect(await screen.findByText("Maya")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /open maya's profile/i }));
    expect(await screen.findByRole("link", { name: /back to likes/i })).toHaveAttribute("href", "/likes");
  });

  it("starts a conversation from Message when none exists yet", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let started = 0;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = methodOf(init);
      if (url.endsWith("/api/v1/matches/m1/conversation") && method === "POST") {
        started += 1;
        return Promise.resolve(jsonResponse(200, { conversation: conversationBody() }));
      }
      if (url.endsWith("/api/v1/conversations")) {
        return Promise.resolve(jsonResponse(200, { conversations: started ? [conversationBody()] : [], next_cursor: null }));
      }
      return Promise.resolve(baseHandler()(input, init));
    });

    renderLikes();
    expect(await screen.findByRole("button", { name: /message maya/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /message maya/i }));
    expect(await screen.findByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(started).toBe(1);
  });

  it("opens an existing conversation instead of creating a parallel one", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let started = 0;
    vi.mocked(fetch).mockImplementation(
      baseHandler((url, method) => {
        if (url.endsWith("/api/v1/conversations")) {
          return jsonResponse(200, { conversations: [conversationBody()], next_cursor: null });
        }
        if (url.endsWith("/api/v1/matches/m1/conversation") && method === "POST") {
          started += 1;
          return jsonResponse(200, { conversation: conversationBody() });
        }
        return undefined;
      }),
    );

    renderLikes();
    expect(await screen.findByRole("button", { name: /open chat with maya/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /open chat with maya/i }));
    expect(await screen.findByRole("heading", { name: "Chats" })).toBeInTheDocument();
    expect(started).toBe(0);
  });

  it("keeps matches visible when conversations fail to load", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation(
      baseHandler((url) => {
        if (url.endsWith("/api/v1/conversations")) return jsonResponse(500, { error: "server_error" });
        return undefined;
      }),
    );

    renderLikes();
    expect(await screen.findByText("Maya")).toBeInTheDocument();
    expect(screen.getByText(/chats didn’t refresh/i)).toBeInTheDocument();
  });

  it("switches to honest incoming and outgoing boundaries without fake people", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation(baseHandler());

    renderLikes();
    expect(await screen.findByText("Maya")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /liked you/i }));
    expect(await screen.findByRole("heading", { name: /people who liked you/i })).toBeInTheDocument();
    expect(screen.getByText(/incoming likes aren’t available yet/i)).toBeInTheDocument();
    expect(screen.queryByText("Maya")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /you liked/i }));
    expect(await screen.findByRole("heading", { name: /you liked/i })).toBeInTheDocument();
    expect(screen.getByText(/sent likes aren’t listed yet/i)).toBeInTheDocument();
  });

  it("shows an optimistic empty state when there are no matches", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation(
      baseHandler((url, method) => {
        if (url.includes("/api/v1/matches") && method === "GET") {
          return jsonResponse(200, { matches: [], next_cursor: null });
        }
        return undefined;
      }),
    );

    renderLikes();
    expect(await screen.findByText(/no matches yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /discover people/i })).toHaveAttribute("href", "/discover");
  });

  it("recovers from a failed matches request without blanking the shell", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let fail = true;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = methodOf(init);
      if (url.includes("/api/v1/matches") && method === "GET" && !url.includes("/conversation")) {
        if (fail) return Promise.resolve(jsonResponse(500, { error: "server_error" }));
        return Promise.resolve(jsonResponse(200, { matches: [matchBody()], next_cursor: null }));
      }
      return Promise.resolve(baseHandler()(input, init));
    });

    renderLikes();
    expect(await screen.findByText(/we couldn’t load your likes/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^likes$/i }).length).toBeGreaterThan(0);
    fail = false;
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByText("Maya")).toBeInTheDocument();
  });

  it("deep-links profile completion suggestions without unsupported stats", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation(baseHandler());

    renderLikes();
    expect(await screen.findByText(/make your profile stand out/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add more photos/i })).toHaveAttribute("href", "/profile/edit#photos");
    expect(screen.queryByText(/3x more likes/i)).not.toBeInTheDocument();
  });

  it("uses All as the default combined relationship view without inventing people", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation(baseHandler());

    renderLikes();
    expect(await screen.findByRole("tab", { name: /all, 1/i })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("tab", { name: /mutual/i })).toBeInTheDocument();
    expect(screen.getByText("Maya")).toBeInTheDocument();
    expect(screen.getByText(/incoming likes aren’t listed yet/i)).toBeInTheDocument();
    expect(screen.getByText(/sent likes aren’t listed yet/i)).toBeInTheDocument();
  });
});
