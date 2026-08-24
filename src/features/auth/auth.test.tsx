import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { getBearerToken, setBearerToken } from "../../lib/api/tokenStore.ts";

const meBody = {
  user_id: 42,
  brand: { slug: "dateza", name: "DateZA" },
  session: { id: 7, expires_at: "2026-12-01T00:00:00Z" },
  identifier: { kind: "email", verified: false, masked_destination: "a••@example.com" },
  verification_required: true,
  verification: { code_dispatched: true, resend_available_in: 42 },
};

const credentialBody = {
  token: "opaque-session-token",
  token_type: "Bearer",
  expires_at: "2026-12-01T00:00:00Z",
  user_id: 42,
  brand: { slug: "dateza", name: "DateZA" },
  identifier: { kind: "email", verified: false, masked_destination: "a••@example.com" },
  verification_required: true,
  verification_channel: "email",
  verification: { code_dispatched: true, resend_available_in: 42 },
  onboarding: {
    state: "profile_required",
    next_step: "profile",
    profile_exists: false,
    profile_complete: false,
    profile_published: false,
    completion: { complete: false, percent: 0, missing: ["first_name", "last_name", "display_name"] },
  },
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

const NEUTRAL_RECOVERY =
  "If an eligible account exists, recovery instructions have been sent.";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
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

function renderApp(path: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <App />
    </MemoryRouter>,
  );
}

describe("authentication flows", () => {
  it("stores the bearer credential and establishes session after a successful sign-in", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        if (getBearerToken()) {
          return Promise.resolve(jsonResponse(200, meBody));
        }
        return Promise.resolve(jsonResponse(401, { error: "unauthorized" }));
      }
      if (url.endsWith("/api/v1/auth/password/login") && method === "POST") {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBeNull();
        return Promise.resolve(jsonResponse(201, credentialBody));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(
          jsonResponse(200, { configuration, onboarding: incompleteOnboarding }),
        );
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, { profile: null, onboarding: incompleteOnboarding }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/sign-in");

    await screen.findByRole("heading", { name: /welcome back/i });
    await user.type(screen.getByLabelText(/email address/i), "ada@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret1");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /let's start with you/i })).toBeInTheDocument();
    });
    expect(getBearerToken()).toBe("opaque-session-token");
  });

  it("does not authenticate when credentials are invalid", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(401, { error: "unauthorized" }));
      }
      if (url.endsWith("/api/v1/auth/password/login") && method === "POST") {
        return Promise.resolve(jsonResponse(401, { error: "invalid_credentials" }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/sign-in");

    await screen.findByRole("heading", { name: /welcome back/i });
    await user.type(screen.getByLabelText(/email address/i), "ada@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrong-password");
    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/did not match/i);
    });
    expect(getBearerToken()).toBeUndefined();
    expect(
      screen.queryByRole("heading", { name: /welcome to dateza/i }),
    ).not.toBeInTheDocument();
  });

  it("clears local credential and session on logout", async () => {
    const user = userEvent.setup();
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/auth/session") && method === "DELETE") {
        return Promise.resolve(emptyResponse(204));
      }
      if (url.endsWith("/api/v1/me")) {
        if (getBearerToken()) {
          return Promise.resolve(jsonResponse(200, meBody));
        }
        return Promise.resolve(jsonResponse(401, { error: "unauthorized" }));
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, {
            profile: {
              id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
              brand: meBody.brand,
              status: "active",
              visibility: "visible",
              options: {},
            },
            onboarding: completeOnboarding,
          }),
        );
      }
      if (url.endsWith("/api/v1/discovery")) {
        return Promise.resolve(
          jsonResponse(200, {
            profiles: [],
            next_cursor: null,
            selection: { allocation_date: "2026-08-24", daily_limit: 10, count: 0, finalized: true, refreshes_at: "2026-08-25T00:00:00+02:00" },
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/home");

    await screen.findByRole("heading", { name: /picked for you today/i });
    await user.click(screen.getAllByRole("link", { name: "Profile" })[0]);
    await user.click(await screen.findByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(getBearerToken()).toBeUndefined();
    });
    expect(screen.queryByRole("heading", { name: /picked for you today/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: /meet someone/i }),
    ).toBeInTheDocument();
  });

  it("routes straight into onboarding after registration, with no verification modal", async () => {
    const user = userEvent.setup();
    const verificationCalls: string[] = [];
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        if (getBearerToken()) {
          return Promise.resolve(jsonResponse(200, meBody));
        }
        return Promise.resolve(jsonResponse(401, { error: "unauthorized" }));
      }
      if (url.endsWith("/api/v1/auth/password/register") && method === "POST") {
        return Promise.resolve(jsonResponse(201, credentialBody));
      }
      if (url.endsWith("/api/v1/auth/verification")) {
        verificationCalls.push(method);
        return Promise.resolve(jsonResponse(202, { message: "sent", resend_available_in: 60 }));
      }
      if (url.endsWith("/api/v1/profile/configuration")) {
        return Promise.resolve(
          jsonResponse(200, { configuration, onboarding: incompleteOnboarding }),
        );
      }
      if (url.endsWith("/api/v1/profile")) {
        return Promise.resolve(
          jsonResponse(200, { profile: null, onboarding: incompleteOnboarding }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/sign-up");

    await screen.findByRole("heading", { name: /join dateza/i });
    await user.type(screen.getByLabelText(/email address/i), "ada@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "secret1");
    await user.type(screen.getByLabelText(/confirm password/i), "secret1");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    // Onboarding, not Discover, right after registration — and no OTP modal
    // anywhere inside it, even though the registration challenge is already
    // dispatched (credentialBody.verification.code_dispatched === true).
    expect(await screen.findByRole("heading", { name: /let's start with you/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(getBearerToken()).toBe("opaque-session-token");
    // The registration challenge must be preserved, not reissued.
    expect(verificationCalls).toEqual([]);
  });

  it("keeps password recovery anti-enumeration copy on a successful request", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(401, { error: "unauthorized" }));
      }
      if (url.endsWith("/api/v1/auth/password/recovery") && method === "POST") {
        return Promise.resolve(jsonResponse(202, { message: NEUTRAL_RECOVERY }));
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/forgot-password");

    await screen.findByRole("heading", { name: /reset your password/i });
    await user.type(screen.getByLabelText(/phone or email/i), "unknown@example.com");
    await user.click(screen.getByRole("button", { name: /send recovery instructions/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(NEUTRAL_RECOVERY);
    });
    expect(screen.queryByText(/does not exist/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/no account/i)).not.toBeInTheDocument();
  });

  it("does not put a reset token in the URL after recovery verify", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/v1/me")) {
        return Promise.resolve(jsonResponse(401, { error: "unauthorized" }));
      }
      if (url.endsWith("/api/v1/auth/password/recovery") && method === "POST") {
        return Promise.resolve(jsonResponse(202, { message: NEUTRAL_RECOVERY }));
      }
      if (url.endsWith("/api/v1/auth/password/recovery/verify") && method === "POST") {
        return Promise.resolve(
          jsonResponse(201, {
            reset_token: "reset-secret-token",
            expires_at: "2026-08-22T12:00:00Z",
          }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    renderApp("/forgot-password");

    await screen.findByRole("heading", { name: /reset your password/i });
    await user.type(screen.getByLabelText(/phone or email/i), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /send recovery instructions/i }));
    const firstDigit = await screen.findByLabelText(/recovery code, digit 1/i);
    await user.type(firstDigit, "123456");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByRole("heading", { name: /choose a new password/i });
    expect(window.location.search).not.toContain("reset");
    expect(screen.queryByDisplayValue("reset-secret-token")).not.toBeInTheDocument();
  });
});
