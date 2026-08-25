import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";

/**
 * Regression coverage for the reported failure: a real `200 /profile`
 * response landed a returning member on "/home" (the transient post-sign-in
 * routing gateway — see destination.ts memberDestination) and rendered
 * "We could not load your profile" even though the request succeeded. The
 * profile fixture below is the real staging shape captured 2026-08-25.
 */

const meBody = {
  user_id: 42,
  brand: { slug: "dateza", name: "DateZA" },
  session: { id: 7, expires_at: "2026-12-01T00:00:00Z" },
  identifier: { kind: "email", verified: true, masked_destination: "a••@example.com" },
  verification_required: false,
  verification: { code_dispatched: false, resend_available_in: 0 },
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

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("MemberHomePage (/home routing gateway)", () => {
  it("never shows the generic profile-load failure for a valid 200 /profile response, and moves on to onboarding", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, {
            profile: {
              id: "874c36b9-b7c5-48bd-8671-5f061c4bd895",
              brand: meBody.brand,
              status: "draft",
              visibility: "hidden",
              location: { configured: false },
              options: {},
              prompts: [],
              completion: { complete: false, percent: 50, missing: ["photos"], sections: {} },
              display_name: "QA Tester",
              birthdate: "1995-05-05",
              gender: "woman",
              country_code: "ZA",
              city: "Cape Town",
              bio: "Testing.",
              smoking: "never",
              drinking: "never",
              occupation: null,
              job_title: null,
              height_cm: null,
              languages: [],
              fitness: null,
              first_name: "QA",
              last_name: "Tester",
            },
            onboarding: {
              state: "profile_incomplete",
              next_step: "photos",
              profile_exists: true,
              profile_complete: false,
              profile_published: false,
              completion: { complete: false, percent: 50, missing: ["photos"] },
            },
          }),
        );
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(
          jsonResponse(200, {
            configuration: {
              identity_fields: [],
              profile_fields: [],
              preference_fields: [],
              collections: [{ key: "photos", label: "Photos", required: true, minimum_count: 1 }],
              option_groups: [],
            },
            onboarding: {
              state: "profile_incomplete",
              next_step: "photos",
              profile_exists: true,
              profile_complete: false,
              profile_published: false,
              completion: { complete: false, percent: 50, missing: ["photos"] },
            },
          }),
        );
      }
      if (url.endsWith("/api/v1/profile/photos")) {
        return Promise.resolve(jsonResponse(200, { photos: [] }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/home");

    expect(await screen.findByRole("heading", { name: /add your best photos/i })).toBeInTheDocument();
    expect(screen.queryByText(/we could not load your profile/i)).not.toBeInTheDocument();
  });
});
