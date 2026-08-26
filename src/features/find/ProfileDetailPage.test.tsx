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
};

const completeOnboarding = {
  state: "complete",
  next_step: null,
  profile_exists: true,
  profile_complete: true,
  profile_published: true,
  completion: { complete: true, percent: 100, missing: [] },
};

const configuration = {
  configuration: {
    identity_fields: [],
    profile_fields: [
      {
        key: "fitness",
        label: "Activity",
        required: false,
        cardinality: "single",
        input_type: "select",
        visibility: "public_profile",
        options: [{ code: "active", label: "Active" }],
      },
    ],
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
      {
        key: "diet",
        label: "Diet",
        cardinality: "single",
        max_selections: 1,
        required: false,
        visibility: "public_profile",
        options: [{ code: "balanced", label: "Balanced diet" }],
      },
    ],
  },
  onboarding: completeOnboarding,
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

function detailProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    display_name: "Thando",
    age: 26,
    bio: "Passionate about living intentionally.",
    gender: "woman",
    pronouns: null,
    country_code: "ZA",
    city: "Cape Town",
    occupation: "Product designer",
    job_title: "Designer",
    school_or_institution: "University of Cape Town",
    looking_for_text: "Someone kind who likes a long walk and a good plan.",
    height_cm: 168,
    body_type: null,
    languages_spoken: ["English", "isiZulu"],
    smoking: "never",
    drinking: "occasionally",
    fitness: "active",
    photos: [
      { id: "ph1", position: 0, url: "https://example.test/1.jpg", url_expires_in: 3600 },
      { id: "ph2", position: 1, url: "https://example.test/2.jpg", url_expires_in: 3600 },
    ],
    options: { relationship_intent: ["long_term_relationship"], diet: ["balanced"] },
    verified: true,
    verification: { contact: { verified: true } },
    online: false,
    active_today: true,
    new_here: false,
    last_active_at: null,
    distance_km: 8,
    hook_tonight_active: false,
    hook_state: "unavailable",
    prompts: [{ key: "weekend", prompt: "My ideal weekend looks like...", answer: "A road trip or a quiet reset.", position: 0 }],
    interests: [{ slug: "hiking", label: "Hiking", category: "outdoors" }],
    compatibility: {
      score: 85,
      confidence: 0.78,
      confidence_level: "high",
      version: "dateza_v1",
      reasons: ["shared_long_term_intent", "compatible_family_plans"],
    },
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

function renderAt(path: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <App />
    </MemoryRouter>,
  );
}

describe("rich profile detail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    setBearerToken("opaque-session-token");
    markLocationConfirmed(ownerProfile.id);
  });

  function mockApis(profile: Record<string, unknown> = detailProfile()) {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
      if (url.endsWith("/api/v1/notifications")) {
        return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0, next_cursor: null }));
      }
      if (url.endsWith("/api/v1/profile/configuration")) return Promise.resolve(jsonResponse(200, configuration));
      if (url.endsWith("/api/v1/profiles/p1")) return Promise.resolve(jsonResponse(200, { profile }));
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });
  }

  it("renders photography, identity, compatibility copy, bio, lifestyle, interests, and prompts", async () => {
    mockApis();
    renderAt("/profile/p1", { from: "discover" });

    expect(await screen.findByRole("heading", { name: "Thando, 26" })).toBeInTheDocument();
    expect(screen.getByText(/cape town, za · 8 km away/i)).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("Great match")).toBeInTheDocument();
    expect(screen.getByText("Both want something long-term")).toBeInTheDocument();
    expect(screen.getByText("Aligned on family plans")).toBeInTheDocument();
    expect(screen.getByText("Verified contact")).toBeInTheDocument();
    expect(screen.queryByText(/realme/i)).not.toBeInTheDocument();
    expect(screen.getByText("Passionate about living intentionally.")).toBeInTheDocument();
    expect(screen.getByText("Long-term relationship")).toBeInTheDocument();
    expect(screen.getByText("Hiking")).toBeInTheDocument();
    expect(screen.getByText("A road trip or a quiet reset.")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Balanced diet")).toBeInTheDocument();
    expect(screen.queryByText("dateza_v1")).not.toBeInTheDocument();
    expect(screen.queryByText("shared_long_term_intent")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /report or block/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^like$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^pass$/i })).toBeInTheDocument();
  });

  it("hides optional sections when the contract omits them", async () => {
    mockApis(
      detailProfile({
        bio: null,
        looking_for_text: null,
        fitness: null,
        smoking: null,
        drinking: null,
        height_cm: null,
        job_title: null,
        occupation: null,
        school_or_institution: null,
        languages_spoken: [],
        options: {},
        prompts: [],
        interests: [],
        compatibility: null,
        photos: [{ id: "ph1", position: 0, url: "https://example.test/1.jpg", url_expires_in: 3600 }],
      }),
    );
    renderAt("/profile/p1", { from: "find" });
    expect(await screen.findByRole("heading", { name: "Thando, 26" })).toBeInTheDocument();
    expect(screen.queryByText(/our compatibility/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/what i'm looking for/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/my lifestyle/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^prompts$/i })).not.toBeInTheDocument();
  });

  it("lets the member move between multiple photos", async () => {
    const user = userEvent.setup();
    mockApis();
    renderAt("/profile/p1", { from: "find" });
    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /next photo/i }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("keeps origin-aware back navigation", async () => {
    mockApis();
    renderAt("/profile/p1", { from: "discover" });
    expect(await screen.findByRole("link", { name: /back to discover/i })).toHaveAttribute("href", "/discover");
  });

  it("returns to Likes when opened from Likes", async () => {
    mockApis();
    renderAt("/profile/p1", { from: "likes" });
    expect(await screen.findByRole("link", { name: /back to likes/i })).toHaveAttribute("href", "/likes");
  });
});
