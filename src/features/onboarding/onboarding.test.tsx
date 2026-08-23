import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";

const meBody = {
  user_id: 42,
  brand: { slug: "dateza", name: "DateZA" },
  session: { id: 7, expires_at: "2026-12-01T00:00:00Z" },
};

const incompleteOnboarding = {
  state: "profile_required",
  next_step: "profile",
  profile_exists: false,
  profile_complete: false,
  profile_published: false,
  completion: {
    complete: false,
    percent: 0,
    missing: ["display_name", "birthdate", "gender"],
  },
};

const preferencesOnboarding = {
  state: "profile_incomplete",
  next_step: "preferences",
  profile_exists: true,
  profile_complete: false,
  profile_published: false,
  completion: {
    complete: false,
    percent: 40,
    missing: ["preferences.min_age"],
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
  profile_fields: [
    {
      key: "display_name",
      label: "First name",
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
      input_type: "text",
      visibility: "public_profile",
      options: [],
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
      options: [],
    },
    {
      key: "min_age",
      label: "Minimum age",
      required: true,
      cardinality: "single",
      input_type: "integer",
      visibility: "owner_only",
      options: [],
    },
    {
      key: "max_age",
      label: "Maximum age",
      required: true,
      cardinality: "single",
      input_type: "integer",
      visibility: "owner_only",
      options: [],
    },
    {
      key: "max_distance_km",
      label: "Maximum distance",
      required: true,
      cardinality: "single",
      input_type: "integer",
      visibility: "owner_only",
      options: [],
    },
  ],
  collections: [{ key: "photos", label: "Photos", required: true, minimum_count: 1 }],
  option_groups: [],
  prompts: [],
};

const photosOnboarding = {
  state: "profile_incomplete",
  next_step: "photos",
  profile_exists: true,
  profile_complete: false,
  profile_published: false,
  completion: {
    complete: false,
    percent: 55,
    missing: ["photos"],
  },
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("onboarding routing and progression", () => {
  it("routes an incomplete authenticated member to onboarding", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(
          jsonResponse(200, { configuration, onboarding: incompleteOnboarding }),
        );
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: null, onboarding: incompleteOnboarding }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/home");

    expect(
      await screen.findByRole("heading", { name: /let's start with you/i }),
    ).toBeInTheDocument();
  });

  it("does not trap a completed member in onboarding", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(
          jsonResponse(200, { configuration, onboarding: completeOnboarding }),
        );
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, { profile: { id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", brand: meBody.brand, status: "active", visibility: "visible", options: {} }, onboarding: completeOnboarding }),
        );
      }
      if (url.endsWith("/api/v1/find")) {
        return Promise.resolve(
          jsonResponse(200, {
            profiles: [],
            next_cursor: null,
            allowance: { limit: 10, used: 0, remaining: 10, exhausted: false, resets_at: "2026-12-02T00:00:00+02:00" },
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/onboarding");

    expect(await screen.findByText(/no new profiles/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /let's start with you/i }),
    ).not.toBeInTheDocument();
  });

  it("advances from the server next_step after a successful profile save", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let profileOnboarding = incompleteOnboarding;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(
          jsonResponse(200, { configuration, onboarding: profileOnboarding }),
        );
      }
      if (url.endsWith("/api/v1/profile/preferences") && method === "GET") {
        return Promise.resolve(jsonResponse(200, { preferences: null }));
      }
      if (url.endsWith("/api/v1/profile") && method === "PATCH") {
        profileOnboarding = preferencesOnboarding;
        return Promise.resolve(
          jsonResponse(200, {
            profile: {
              id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
              brand: meBody.brand,
              status: "draft",
              visibility: "hidden",
              display_name: "Ada",
              birthdate: "1994-05-01",
              gender: "woman",
              options: {},
            },
            onboarding: preferencesOnboarding,
          }),
        );
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: null, onboarding: profileOnboarding }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/onboarding");

    await screen.findByRole("heading", { name: /let's start with you/i });
    await user.type(screen.getByLabelText(/first name/i), "Ada");
    await user.selectOptions(screen.getByLabelText(/^day$/i), "1");
    await user.selectOptions(screen.getByLabelText(/^month$/i), "5");
    await user.selectOptions(screen.getByLabelText(/^year$/i), "1994");
    await user.click(screen.getByRole("radio", { name: /^woman$/i }));
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(
      await screen.findByRole("heading", { name: /who would you like to meet/i }),
    ).toBeInTheDocument();
  });

  it("does not advance the UI when a profile save fails", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(
          jsonResponse(200, { configuration, onboarding: incompleteOnboarding }),
        );
      }
      if (url.endsWith("/api/v1/profile") && method === "PATCH") {
        return Promise.resolve(
          jsonResponse(422, {
            error: "invalid_profile",
            details: { birthdate: ["must be at least 18 years ago"] },
          }),
        );
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: null, onboarding: incompleteOnboarding }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/onboarding");

    await screen.findByRole("heading", { name: /let's start with you/i });
    await user.type(screen.getByLabelText(/first name/i), "Ada");
    await user.selectOptions(screen.getByLabelText(/^day$/i), "1");
    await user.selectOptions(screen.getByLabelText(/^month$/i), "1");
    await user.selectOptions(screen.getByLabelText(/^year$/i), "1994");
    await user.click(screen.getByRole("radio", { name: /^woman$/i }));
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(await screen.findByText(/you need to be 18 or older/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /let's start with you/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /who would you like to meet/i }),
    ).not.toBeInTheDocument();
  });

  it("sends an unauthenticated visitor away from onboarding", async () => {
    renderApp("/onboarding");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /welcome back/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: /let's start with you/i }),
    ).not.toBeInTheDocument();
  });

  it("saves who you want to meet with broad defaults and advances", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let profileOnboarding = preferencesOnboarding;
    let preferenceBody: Record<string, unknown> | undefined;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(
          jsonResponse(200, { configuration, onboarding: profileOnboarding }),
        );
      }
      if (url.endsWith("/api/v1/profile/preferences") && method === "PATCH") {
        preferenceBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        profileOnboarding = photosOnboarding;
        return Promise.resolve(
          jsonResponse(200, {
            preferences: {
              min_age: 18,
              max_age: 120,
              max_distance_km: 500,
              interested_in: ["woman"],
            },
          }),
        );
      }
      if (url.endsWith("/api/v1/profile/preferences")) {
        return Promise.resolve(jsonResponse(200, { preferences: null }));
      }
      if (url.includes("/api/v1/profile/photos")) {
        return Promise.resolve(jsonResponse(200, { photos: [] }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, {
            profile: {
              id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
              brand: meBody.brand,
              status: "draft",
              visibility: "hidden",
              options: {},
            },
            onboarding: profileOnboarding,
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/onboarding");

    await screen.findByRole("heading", { name: /who would you like to meet/i });
    expect(screen.queryByLabelText(/minimum age/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/maximum distance/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /^women$/i }));
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(
      await screen.findByRole("heading", { name: /add your best photos/i }),
    ).toBeInTheDocument();
    expect(preferenceBody).toEqual({
      min_age: 18,
      max_age: 120,
      max_distance_km: 500,
      interested_in: ["woman"],
    });
  });

  it("does not leave the meet step when nobody is selected", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(
          jsonResponse(200, { configuration, onboarding: preferencesOnboarding }),
        );
      }
      if (url.endsWith("/api/v1/profile/preferences")) {
        return Promise.resolve(jsonResponse(200, { preferences: null }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, {
            profile: {
              id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
              brand: meBody.brand,
              status: "draft",
              visibility: "hidden",
              options: {},
            },
            onboarding: preferencesOnboarding,
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/onboarding");

    await screen.findByRole("heading", { name: /who would you like to meet/i });
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    expect(
      await screen.findByText(/choose at least one option/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /who would you like to meet/i }),
    ).toBeInTheDocument();
  });
});

const optionsOnboarding = {
  state: "profile_incomplete",
  next_step: "options",
  profile_exists: true,
  profile_complete: false,
  profile_published: false,
  completion: {
    complete: false,
    // The real D8N API namespaces option-group entries as "options.<key>"
    // (not the bare key configuration.option_groups[].key uses) — keep this
    // realistic so this fixture guards against re-breaking that mapping.
    percent: 70,
    missing: [
      "options.relationship_intent",
      "options.has_children",
      "options.wants_children",
      "options.religion_importance",
      "options.social_style",
      "options.meeting_pace",
    ],
  },
};

const ownerPhoto = {
  id: 11,
  profile_id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  position: 1,
  status: "pending_review",
  visibility: "hidden",
  processing_state: "pending",
  deleted_at: null,
  image: {
    filename: "me.png",
    content_type: "image/png",
    byte_size: 80,
    url: "https://media.example/photo",
    url_expires_in: 300,
  },
};

const tinyPng = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="),
  (char) => char.charCodeAt(0),
);

describe("onboarding photo step", () => {
  it("does not advance without a required photo", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, { configuration, onboarding: photosOnboarding }));
      }
      if (url.endsWith("/api/v1/profile/photos")) {
        return Promise.resolve(jsonResponse(200, { photos: [] }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, {
            profile: {
              id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
              brand: meBody.brand,
              status: "draft",
              visibility: "hidden",
              options: {},
            },
            onboarding: photosOnboarding,
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/onboarding");
    await screen.findByRole("heading", { name: /add your best photos/i });
    expect(screen.getByRole("button", { name: /^continue$/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(screen.getByRole("heading", { name: /add your best photos/i })).toBeInTheDocument();
  });

  it("reconciles a successful attach and then continues to the next step", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let listed: unknown[] = [];
    let onboarding = photosOnboarding;
    let intentCalls = 0;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, { configuration, onboarding }));
      }
      if (url.includes("/api/v1/profile/photos/uploads") && method === "POST") {
        intentCalls += 1;
        return Promise.resolve(
          jsonResponse(201, {
            upload: {
              signed_id: "signed-1",
              url: "https://storage.example/put",
              headers: { "Content-Type": "image/png" },
              expires_in: 600,
              byte_size_limit: 10_485_760,
              allowed_content_types: ["image/jpeg", "image/png", "image/webp"],
            },
          }),
        );
      }
      if (url === "https://storage.example/put" && method === "PUT") {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      if (url.endsWith("/api/v1/profile/photos") && method === "POST") {
        listed = [ownerPhoto];
        onboarding = optionsOnboarding;
        return Promise.resolve(jsonResponse(201, { photo: ownerPhoto }));
      }
      if (url.endsWith("/api/v1/profile/photos")) {
        return Promise.resolve(jsonResponse(200, { photos: listed }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, {
            profile: {
              id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
              brand: meBody.brand,
              status: "draft",
              visibility: "hidden",
              options: {},
            },
            onboarding,
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/onboarding");
    await screen.findByRole("heading", { name: /add your best photos/i });
    const file = new File([tinyPng], "me.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/choose a photo/i), file);

    expect(await screen.findByAltText(/your main photo/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /add your best photos/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(
      await screen.findByRole("heading", { name: /what are you looking for/i }),
    ).toBeInTheDocument();
    expect(intentCalls).toBe(1);
  });

  it("stays on photos when upload fails", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, { configuration, onboarding: photosOnboarding }));
      }
      if (url.includes("/api/v1/profile/photos/uploads") && method === "POST") {
        return Promise.resolve(jsonResponse(422, { error: "unsupported_content_type" }));
      }
      if (url.endsWith("/api/v1/profile/photos")) {
        return Promise.resolve(jsonResponse(200, { photos: [] }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, {
            profile: {
              id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
              brand: meBody.brand,
              status: "draft",
              visibility: "hidden",
              options: {},
            },
            onboarding: photosOnboarding,
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/onboarding");
    await screen.findByRole("heading", { name: /add your best photos/i });
    const file = new File([tinyPng], "me.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/choose a photo/i), file);

    expect(await screen.findByText(/jpeg, png, or webp/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /add your best photos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^continue$/i })).toBeDisabled();
  });

  it("does not start a second upload while one is in progress", async () => {
    setBearerToken("opaque-session-token");
    let intentCalls = 0;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, { configuration, onboarding: photosOnboarding }));
      }
      if (url.includes("/api/v1/profile/photos/uploads") && method === "POST") {
        intentCalls += 1;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(jsonResponse(422, { error: "unsupported_content_type" }));
          }, 80);
        });
      }
      if (url.endsWith("/api/v1/profile/photos")) {
        return Promise.resolve(jsonResponse(200, { photos: [] }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, {
            profile: {
              id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
              brand: meBody.brand,
              status: "draft",
              visibility: "hidden",
              options: {},
            },
            onboarding: photosOnboarding,
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/onboarding");
    await screen.findByRole("heading", { name: /add your best photos/i });
    const input = screen.getByLabelText(/choose a photo/i);
    const first = new File([tinyPng], "one.png", { type: "image/png" });
    const second = new File([tinyPng], "two.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [first] } });
    fireEvent.change(input, { target: { files: [second] } });

    await waitFor(() => {
      expect(intentCalls).toBe(1);
    });
  });
});
