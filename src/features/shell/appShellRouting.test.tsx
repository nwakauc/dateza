import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";

/**
 * FE-01: verification must never outrank incomplete onboarding. These tests
 * exercise AppShell's onboarding guard directly (visiting an app-shell route
 * such as /discover, not just the /sign-up or /home entry points), since
 * that guard — not any single page's redirect — is the routing precedence
 * fix: unauthenticated -> auth; onboarding incomplete -> onboarding (no OTP
 * modal); onboarding complete -> Discover, with the OTP modal gated on
 * verification only once onboarding is confirmed complete.
 */

const ownerProfile = {
  id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  brand: { slug: "dateza", name: "DateZA" },
  status: "active",
  visibility: "visible",
  location: { configured: true, place: null },
  options: {},
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
  preference_fields: [],
  collections: [],
  option_groups: [],
  prompts: [],
};

function meBody(overrides: Record<string, unknown> = {}) {
  return {
    user_id: 42,
    brand: { slug: "dateza", name: "DateZA" },
    session: { id: 7, expires_at: "2026-12-01T00:00:00Z" },
    identifier: { kind: "email", verified: false, masked_destination: "a••@example.com" },
    verification_required: true,
    verification: { code_dispatched: true, resend_available_in: 0 },
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

const emptyDiscoveryResponse = {
  profiles: [],
  next_cursor: null,
  selection: {
    allocation_date: "2026-08-24",
    daily_limit: 10,
    count: 0,
    finalized: true,
    refreshes_at: "2026-08-25T00:00:00+02:00",
  },
};

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("app-shell routing precedence (FE-01)", () => {

  it("resumes onboarding for a returning member who visits Discover directly, and never opens the verification modal", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody()));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(jsonResponse(200, { configuration, onboarding: incompleteOnboarding }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: null, onboarding: incompleteOnboarding }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/discover");

    expect(await screen.findByRole("heading", { name: /let's start with you/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: /^discover$/i })).not.toBeInTheDocument();
  });

  it("shows Discover with the OTP modal already on the code-entry step for a completed, unverified member — without reissuing a code", async () => {
    setBearerToken("opaque-session-token");
    let verificationPatchCalls = 0;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = methodOf(init);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody()));
      }
      if (url.endsWith("/api/v1/auth/verification") && method === "POST") {
        throw new Error("must not request a fresh code just because Discover mounted");
      }
      if (url.endsWith("/api/v1/auth/verification") && method === "PATCH") {
        verificationPatchCalls += 1;
        return Promise.resolve(jsonResponse(200, { identifier: { kind: "email", verified: true } }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(jsonResponse(200, emptyDiscoveryResponse));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/discover");

    expect(await screen.findByRole("heading", { level: 1, name: /^discover$/i })).toBeInTheDocument();
    expect(await screen.findByRole("dialog", { name: /verify your email/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /enter your code/i })).toBeInTheDocument();
    expect(verificationPatchCalls).toBe(0);
  });

  it("does not open the verification modal on Discover once the member is verified", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = requestUrl(input);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(
          jsonResponse(
            200,
            meBody({
              identifier: { kind: "email", verified: true, masked_destination: "a••@example.com" },
              verification_required: false,
              verification: { code_dispatched: false, resend_available_in: 0 },
            }),
          ),
        );
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(jsonResponse(200, emptyDiscoveryResponse));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/discover");

    expect(await screen.findByRole("heading", { level: 1, name: /^discover$/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the modal and stays on Discover after a successful verification", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    let verified = false;
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = methodOf(init);
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(200, meBody({ identifier: { kind: "email", verified, masked_destination: "a••@example.com" } })));
      }
      if (url.endsWith("/api/v1/auth/verification") && method === "PATCH") {
        verified = true;
        return Promise.resolve(jsonResponse(200, { identifier: { kind: "email", verified: true } }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(jsonResponse(200, { profile: ownerProfile, onboarding: completeOnboarding }));
      }
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(jsonResponse(200, emptyDiscoveryResponse));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/discover");

    await screen.findByRole("heading", { level: 1, name: /^discover$/i });
    const first = await screen.findByLabelText(/verification code, digit 1/i);
    fireEvent.change(first, { target: { value: "123456" } });
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    expect(await screen.findByRole("heading", { name: /email verified/i })).toBeInTheDocument();
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      },
      { timeout: 2_000 },
    );
    expect(screen.getByRole("heading", { level: 1, name: /^discover$/i })).toBeInTheDocument();
  });
});
