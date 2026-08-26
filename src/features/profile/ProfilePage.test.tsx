import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { markLocationConfirmed } from "../../lib/locationConfirmationStore.ts";

const ownerId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

const ownerProfile = {
  id: ownerId,
  brand: { slug: "dateza", name: "DateZA" },
  status: "active",
  visibility: "visible",
  first_name: "Private",
  last_name: "Name",
  display_name: "Thando",
  bio: "I'm passionate about living intentionally.",
  birthdate: "1998-05-26",
  gender: "woman",
  country_code: "ZA",
  city: "Cape Town",
  occupation: "Marketer",
  job_title: "Marketing Manager",
  school_or_institution: "UCT",
  looking_for_text: "Looking for something meaningful with someone kind.",
  company_name: "Bright Ideas",
  height_cm: 168,
  smoking: "never",
  drinking: "occasionally",
  fitness: "active",
  languages_spoken: ["English", "isiZulu"],
  options: {
    interests: ["hiking"],
    relationship_intent: ["long_term_relationship"],
    has_children: ["no"],
    religion: ["christian"],
  },
  prompts: [{ key: "key_to_heart", prompt: "The key to my heart is…", answer: "Good conversations and even better dessert.", position: 0 }],
  verification: { contact: { verified: true } },
  profile_completion: {
    percent: 72,
    level: "good",
    missing: ["more_photos", "languages"],
    suggestions: [
      { key: "more_photos", label: "Add 2 more photos" },
      { key: "prompts", label: "Answer a prompt" },
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

const configuration = {
  identity_fields: [],
  profile_fields: [],
  preference_fields: [],
  collections: [],
  prompts: [{ key: "key_to_heart", text: "The key to my heart is…", category: null }],
  openers: [],
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
      key: "interests",
      label: "Interests",
      cardinality: "multiple",
      max_selections: 10,
      required: false,
      visibility: "public_profile",
      options: [{ code: "hiking", label: "Hiking", category: "outdoors" }],
    },
    {
      key: "religion",
      label: "Religion",
      cardinality: "single",
      max_selections: 1,
      required: false,
      visibility: "matching_only",
      options: [{ code: "christian", label: "Christian" }],
    },
  ],
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

function detailBody(overrides: Record<string, unknown> = {}) {
  return {
    id: ownerId,
    display_name: "Thando",
    age: 26,
    bio: "I'm passionate about living intentionally.",
    gender: "woman",
    pronouns: null,
    country_code: "ZA",
    city: "Cape Town",
    occupation: "Marketer",
    job_title: "Marketing Manager",
    school_or_institution: "UCT",
    looking_for_text: "Looking for something meaningful with someone kind.",
    height_cm: 168,
    body_type: null,
    languages_spoken: ["English", "isiZulu"],
    smoking: "never",
    drinking: "occasionally",
    fitness: "active",
    photos: [
      { id: "ph1", position: 0, primary: true, url: "https://example.test/1.jpg", url_expires_in: 3600 },
      { id: "ph2", position: 1, primary: false, url: "https://example.test/2.jpg", url_expires_in: 3600 },
    ],
    options: {
      relationship_intent: ["long_term_relationship"],
      religion: ["christian"],
      has_children: ["no"],
    },
    verified: true,
    online: true,
    active_today: true,
    new_here: false,
    last_active_at: "2026-08-26T08:00:00Z",
    distance_km: 6,
    hook_tonight_active: false,
    hook_state: "unavailable",
    prompts: ownerProfile.prompts,
    interests: [{ slug: "hiking", label: "Hiking", category: "outdoors" }],
    compatibility: {
      score: 85,
      confidence: 0.9,
      confidence_level: "high",
      version: "dateza_v1",
      reasons: ["shared_long_term_intent"],
    },
    ...overrides,
  };
}

function mockApis(detail: Record<string, unknown> | null = detailBody()) {
  vi.mocked(fetch).mockImplementation((input) => {
    const url = requestUrl(input);
    if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
    if (url.endsWith("/api/v1/profile/configuration")) {
      return Promise.resolve(jsonResponse(200, { configuration, onboarding: completeOnboarding }));
    }
    if (url.endsWith("/api/v1/profile")) {
      return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
    }
    if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
    if (url.endsWith("/api/v1/notifications")) {
      return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0, next_cursor: null }));
    }
    if (url.endsWith(`/api/v1/profiles/${ownerId}`)) {
      if (detail === null) return Promise.resolve(jsonResponse(404, { error: "not_found" }));
      return Promise.resolve(jsonResponse(200, { profile: detail }));
    }
    return Promise.resolve(jsonResponse(404, { error: "not_found" }));
  });
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("My profile / How you appear", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    markLocationConfirmed(ownerId);
    setBearerToken("opaque-session-token");
  });

  it("loads the owner preview with public fields and owner chrome", async () => {
    mockApis();
    renderApp("/profile");

    expect(await screen.findByText("How you appear")).toBeInTheDocument();
    expect(screen.getByText(/close to what other people see/i)).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Thando, 26" })).toBeInTheDocument();
    expect(screen.getByText(/I'm passionate about living intentionally/i)).toBeInTheDocument();
    expect(screen.getByText(/looking for something meaningful/i)).toBeInTheDocument();
    expect(screen.getByText("Hiking")).toBeInTheDocument();
    expect(screen.getByText(/english and isizulu/i)).toBeInTheDocument();
    expect(screen.getByText(/good conversations and even better dessert/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /edit profile/i })).toHaveAttribute("href", "/profile/edit");
    expect(screen.getByRole("link", { name: /manage photos/i })).toHaveAttribute("href", "/profile/edit#photos");
    expect(screen.getAllByText("72%").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /add 2 more photos/i })[0]).toHaveAttribute("href", "/profile/edit#photos");
    expect(screen.queryByRole("button", { name: /^like$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^pass$/i })).not.toBeInTheDocument();
  });

  it("does not show viewer-relative compatibility, distance, or owner-only fields", async () => {
    mockApis();
    renderApp("/profile");
    expect(await screen.findByRole("heading", { name: "Thando, 26" })).toBeInTheDocument();
    expect(screen.queryByText("85%")).not.toBeInTheDocument();
    expect(screen.queryByText(/85% compatible/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/6 km away/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Bright Ideas")).not.toBeInTheDocument();
    expect(screen.queryByText("Christian")).not.toBeInTheDocument();
    expect(screen.queryByText(/has children/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Private")).not.toBeInTheDocument();
    expect(screen.getByText(/compatibility appears here when another member views your profile/i)).toBeInTheDocument();
  });

  it("hides empty optional sections and adapts a single photo", async () => {
    mockApis(
      detailBody({
        prompts: [],
        languages_spoken: [],
        interests: [],
        looking_for_text: null,
        options: {},
        photos: [{ id: "ph1", position: 0, primary: true, url: "https://example.test/1.jpg", url_expires_in: 3600 }],
      }),
    );
    renderApp("/profile");
    expect(await screen.findByRole("heading", { name: "Thando, 26" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^prompts$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^languages$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /^passions$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/what i'm looking for/i)).not.toBeInTheDocument();
    expect(screen.getByText("1 photo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next photo/i })).not.toBeInTheDocument();
  });

  it("lets the owner move between photos", async () => {
    const user = userEvent.setup();
    mockApis();
    renderApp("/profile");
    expect(await screen.findByText("1 / 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /next photo/i }));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("falls back to owner public preview when the public profile request fails", async () => {
    mockApis(null);
    renderApp("/profile");
    expect(await screen.findByRole("heading", { name: /Thando,/ })).toBeInTheDocument();
    expect(screen.queryByText("Bright Ideas")).not.toBeInTheDocument();
    expect(screen.queryByText("85%")).not.toBeInTheDocument();
  });
});
