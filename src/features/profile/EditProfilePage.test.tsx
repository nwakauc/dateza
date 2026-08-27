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
  display_name: "Thando",
  bio: "Cape Town evenings and long conversations.",
  birthdate: "1998-05-26",
  gender: "woman",
  country_code: "ZA",
  city: "Cape Town",
  occupation: "Marketer",
  job_title: "Marketing Manager",
  school_or_institution: "UCT",
  looking_for_text: "Someone emotionally mature.",
  company_name: "Bright Ideas",
  height_cm: 168,
  smoking: "never",
  drinking: "occasionally",
  fitness: "active",
  languages_spoken: ["en"],
  options: {
    interests: ["hiking"],
    relationship_intent: ["long_term_relationship"],
    has_children: ["no"],
    religion: ["christian"],
  },
  prompts: [{ key: "key_to_heart", prompt: "The key to my heart is…", answer: "Good dessert.", position: 0 }],
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
  profile_fields: [
    {
      key: "display_name",
      label: "Display name",
      required: true,
      cardinality: "single",
      input_type: "text",
      visibility: "public_profile",
      options: [],
    },
    {
      key: "birthdate",
      label: "Date of birth",
      required: true,
      cardinality: "single",
      input_type: "date",
      visibility: "owner_only",
      options: [],
    },
    {
      key: "gender",
      label: "Gender",
      required: true,
      cardinality: "single",
      input_type: "select",
      visibility: "public_profile",
      options: [
        { code: "woman", label: "Woman" },
        { code: "man", label: "Man" },
      ],
    },
    {
      key: "languages",
      label: "Languages",
      required: false,
      cardinality: "multiple",
      input_type: "language_list",
      visibility: "public_profile",
      options: [
        { code: "en", label: "English" },
        { code: "zu", label: "Zulu" },
      ],
    },
  ],
  preference_fields: [
    {
      key: "interested_in",
      label: "Interested in",
      required: true,
      cardinality: "multiple",
      input_type: "string_list",
      visibility: "owner_only",
      options: [
        { code: "woman", label: "Women" },
        { code: "man", label: "Men" },
      ],
    },
  ],
  collections: [{ key: "photos", label: "Photos", required: true, minimum_count: 1, maximum_count: 6 }],
  option_groups: [
    {
      key: "relationship_intent",
      label: "Relationship intent",
      cardinality: "single",
      max_selections: 1,
      required: false,
      visibility: "public_profile",
      options: [
        { code: "long_term_relationship", label: "Long-term relationship" },
        { code: "open_to_dating", label: "Open to dating" },
      ],
    },
    {
      key: "interests",
      label: "Interests",
      cardinality: "multiple",
      max_selections: 8,
      required: false,
      visibility: "public_profile",
      options: [
        { code: "hiking", label: "Hiking", category: "outdoors" },
        { code: "cooking", label: "Cooking", category: "food" },
      ],
    },
    {
      key: "has_children",
      label: "Children",
      cardinality: "single",
      max_selections: 1,
      required: false,
      visibility: "owner_only",
      options: [{ code: "no", label: "Don't have children" }],
    },
  ],
  prompts: [{ key: "key_to_heart", text: "The key to my heart is…", category: null }],
  openers: [],
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

function methodOf(init?: RequestInit): string {
  return init?.method ?? "GET";
}

function placesListResponse(url: string): Response | undefined {
  if (url !== "/api/v1/places" && !url.startsWith("/api/v1/places?")) {
    return undefined;
  }
  return jsonResponse(200, {
    places: [{ id: 11, kind: "region", name: "Western Cape", code: "western-cape", has_children: true }],
  });
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("Edit profile", () => {
  beforeEach(() => {
    markLocationConfirmed(ownerProfile.id);
    setBearerToken("opaque-session-token");
  });

  it("populates existing owner values and hides company from preview", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      const places = placesListResponse(url);
      if (places) return Promise.resolve(places);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, { configuration, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile/prompts")) {
        return Promise.resolve(jsonResponse(200, { prompts: ownerProfile.prompts }));
      }
      if (url.endsWith("/api/v1/profile/preferences")) {
        return Promise.resolve(jsonResponse(200, { preferences: { min_age: 21, max_age: 40, max_distance_km: 50, interested_in: ["man"] } }));
      }
      if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
      if (url.endsWith("/api/v1/notifications")) return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0 }));
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/profile/edit");
    expect(await screen.findByRole("heading", { level: 1, name: /edit profile/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Thando")).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Cape Town evenings/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bright Ideas")).toBeInTheDocument();
    const previews = screen.getAllByLabelText("Profile preview");
    expect(previews.some((node) => node.textContent?.includes("Bright Ideas"))).toBe(false);
    expect(screen.getAllByText("72%").length).toBeGreaterThan(0);
    expect(screen.queryByText(/your profile is incomplete/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /work & education/i })).not.toBeInTheDocument();
  });

  it("saves bio through PATCH /profile and keeps the page on an error in options", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = methodOf(init);
      const places = placesListResponse(url);
      if (places) return Promise.resolve(places);
      calls.push(`${method} ${url}`);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, { configuration, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile") && method === "PATCH") {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile/prompts") && method === "PUT") {
        return Promise.resolve(jsonResponse(200, { prompts: ownerProfile.prompts }));
      }
      if (url.endsWith("/api/v1/profile/prompts")) {
        return Promise.resolve(jsonResponse(200, { prompts: ownerProfile.prompts }));
      }
      if (url.endsWith("/api/v1/profile/preferences") && method === "PATCH") {
        return Promise.resolve(jsonResponse(200, {}));
      }
      if (url.endsWith("/api/v1/profile/preferences")) {
        return Promise.resolve(jsonResponse(200, { preferences: { min_age: 21, max_age: 40, max_distance_km: 50, interested_in: ["man"] } }));
      }
      if (url.endsWith("/api/v1/profile/options") && method === "PATCH") {
        return Promise.resolve(jsonResponse(500, { error: "server" }));
      }
      if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
      if (url.endsWith("/api/v1/notifications")) return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0 }));
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/profile/edit");
    const bio = await screen.findByDisplayValue(/Cape Town evenings/);
    await user.clear(bio);
    await user.type(bio, "Updated bio for DateZA.");
    await user.click(screen.getByRole("button", { name: /save changes/i }));
    expect(await screen.findByText(/couldn't save some of your answers/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /edit profile/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Updated bio for DateZA.")).toBeInTheDocument();
    expect(calls.some((item) => item.startsWith("PATCH") && item.endsWith("/api/v1/profile"))).toBe(true);
  });

  it("deep-links photos from profile completion", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      const places = placesListResponse(url);
      if (places) return Promise.resolve(places);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, { configuration, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile/prompts")) return Promise.resolve(jsonResponse(200, { prompts: [] }));
      if (url.endsWith("/api/v1/profile/preferences")) {
        return Promise.resolve(jsonResponse(200, { preferences: { min_age: 21, max_age: 40, max_distance_km: 50, interested_in: ["man"] } }));
      }
      if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
      if (url.endsWith("/api/v1/notifications")) return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0 }));
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/profile/edit#photos");
    expect(await screen.findByRole("heading", { name: /photos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add photo/i })).toBeInTheDocument();
  });

  it("does not show a save bar until the draft is dirty", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      const places = placesListResponse(url);
      if (places) return Promise.resolve(places);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, { configuration, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile/prompts")) return Promise.resolve(jsonResponse(200, { prompts: ownerProfile.prompts }));
      if (url.endsWith("/api/v1/profile/preferences")) {
        return Promise.resolve(jsonResponse(200, { preferences: { min_age: 21, max_age: 40, max_distance_km: 50, interested_in: ["man"] } }));
      }
      if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
      if (url.endsWith("/api/v1/notifications")) return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0 }));
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/profile/edit");
    await screen.findByDisplayValue("Thando");
    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument();
  });

  it("saves dating location through PUT /profile/place and shows the server label", async () => {
    const user = userEvent.setup();
    let savedBody: Record<string, unknown> | undefined;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = methodOf(init);
      const places = placesListResponse(url);
      if (places) return Promise.resolve(places);
      if (url.endsWith("/api/v1/me")) return Promise.resolve(jsonResponse(200, meBody()));
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, { configuration, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile/place") && method === "PUT") {
        savedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
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
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/profile/prompts")) return Promise.resolve(jsonResponse(200, { prompts: ownerProfile.prompts }));
      if (url.endsWith("/api/v1/profile/preferences")) {
        return Promise.resolve(jsonResponse(200, { preferences: { min_age: 21, max_age: 40, max_distance_km: 50, interested_in: ["man"] } }));
      }
      if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse(200, { photos: [] }));
      if (url.endsWith("/api/v1/notifications")) return Promise.resolve(jsonResponse(200, { notifications: [], unread_count: 0 }));
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/profile/edit");
    expect(await screen.findByRole("heading", { name: /choose a province or region/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /use western cape as dating location/i }));
    expect(await screen.findByText("Dating from Western Cape")).toBeInTheDocument();
    expect(savedBody).toEqual({ place_id: 11 });
  });
});
