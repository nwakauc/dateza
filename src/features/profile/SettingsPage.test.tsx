import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";

const onboarding = {
  state: "complete",
  next_step: null,
  profile_exists: true,
  profile_complete: true,
  profile_published: true,
  completion: { complete: true, percent: 100, missing: [] },
};

const profile = {
  id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  brand: { slug: "dateza", name: "DateZA" },
  status: "active",
  visibility: "visible",
  display_name: "Thando",
  city: "Cape Town",
  verification: { contact: { verified: true } },
  profile_completion: {
    percent: 72,
    level: "good",
    missing: ["more_photos"],
    suggestions: [{ key: "more_photos", label: "Add 2 more photos" }],
    sections: {},
  },
};

function jsonResponse(body: unknown, status = 200): Response {
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

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method;
  return input instanceof Request ? input.method : "GET";
}

function installApi() {
  return vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = requestUrl(input);
    const method = requestMethod(input, init);
    if (url.endsWith("/api/v1/me")) {
      return Promise.resolve(jsonResponse({
        user_id: 42,
        brand: { slug: "dateza", name: "DateZA" },
        session: { id: 7, expires_at: "2026-12-01T00:00:00Z" },
        identifier: { kind: "email", verified: true, masked_destination: "t•••••@example.com" },
        verification_required: false,
        verification: { code_dispatched: false, resend_available_in: 0 },
      }));
    }
    if (url.endsWith("/api/v1/profile") && method === "GET") {
      return Promise.resolve(jsonResponse({ profile, onboarding }));
    }
    if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(jsonResponse({ photos: [] }));
    if (url.endsWith("/api/v1/notifications")) {
      return Promise.resolve(jsonResponse({ notifications: [], unread_count: 0 }));
    }
    if (url.endsWith("/api/v1/blocks")) {
      return Promise.resolve(jsonResponse({
        blocks: [{
          profile: { id: "blocked-profile", display_name: "Lerato" },
          blocked_at: "2026-08-20T12:00:00Z",
        }],
      }));
    }
    if (url.endsWith("/api/v1/profiles/blocked-profile/block") && method === "DELETE") {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    if (url.endsWith("/api/v1/auth/password") && method === "PATCH") {
      return Promise.resolve(jsonResponse({ message: "Password changed" }));
    }
    if (url.endsWith("/api/v1/auth/email/change") && method === "POST") {
      return Promise.resolve(jsonResponse({ message: "Code sent" }, 202));
    }
    if (url.endsWith("/api/v1/auth/email/change") && method === "PATCH") {
      return Promise.resolve(jsonResponse({
        identifier: { kind: "email", verified: true },
        revoked_session_count: 1,
      }));
    }
    if (url.endsWith("/api/v1/me") && method === "DELETE") {
      return Promise.resolve(jsonResponse({
        closed: true,
        already_closed: false,
        media_purge_state: "pending",
      }));
    }
    if (url.endsWith("/api/v1/profile/preferences") && method === "GET") {
      return Promise.resolve(jsonResponse({
        preferences: { min_age: 24, max_age: 36, max_distance_km: 50, interested_in: ["man"] },
      }));
    }
    if (url.endsWith("/api/v1/profile/preferences") && method === "PATCH") {
      return Promise.resolve(jsonResponse({}));
    }
    if (url.endsWith("/api/v1/profile/configuration")) {
      return Promise.resolve(jsonResponse({
        configuration: {
          identity_fields: [],
          profile_fields: [],
          preference_fields: [{
            key: "interested_in",
            label: "Interested in",
            required: true,
            cardinality: "multiple",
            input_type: "string_list",
            visibility: "owner_only",
            options: [{ code: "woman", label: "Women" }, { code: "man", label: "Men" }],
          }],
          collections: [],
          option_groups: [],
          prompts: [],
          openers: [],
        },
        onboarding,
      }));
    }
    if (url.endsWith("/api/v1/auth/session") && method === "DELETE") {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return Promise.resolve(jsonResponse({ error: "not_found" }, 404));
  });
}

function renderSettings(entry = "/settings") {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <App />
    </MemoryRouter>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    setBearerToken("settings-test-token");
  });

  it("shows authoritative account state and profile completion", async () => {
    installApi();
    renderSettings();

    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect((await screen.findAllByText("t•••••@example.com")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Verified contact").length).toBeGreaterThan(0);
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add 2 more photos" })).toHaveAttribute("href", "/profile/edit#photos");
    expect(screen.getByRole("link", { name: /Edit profile/ })).toHaveAttribute("href", "/profile/edit");
  });

  it("deep-links to a focused section and persists preference changes", async () => {
    const fetchMock = installApi();
    const user = userEvent.setup();
    renderSettings("/settings#preferences");

    const distance = await screen.findByRole("slider", { name: "Maximum dating distance in kilometres" });
    expect(distance).toHaveValue("50");
    await user.click(screen.getByRole("button", { name: "Women" }));
    await user.clear(screen.getByLabelText("From"));
    await user.type(screen.getByLabelText("From"), "25");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Preferences saved.")).toBeInTheDocument();
    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([input, init]) =>
        requestUrl(input).endsWith("/api/v1/profile/preferences") && requestMethod(input, init) === "PATCH");
      expect(call).toBeDefined();
      expect(JSON.parse(String(call?.[1]?.body))).toEqual({
        min_age: 25,
        max_age: 36,
        max_distance_km: 50,
        interested_in: ["man", "woman"],
      });
    });
  });

  it("keeps unsupported capabilities visibly non-interactive", async () => {
    installApi();
    renderSettings("/settings#payments");

    expect(await screen.findByText("DateZA Premium is not available")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upgrade/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThan(0);
  });

  it("scrolls desktop section navigation to the selected area", async () => {
    installApi();
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    renderSettings();

    await screen.findByText("Lerato");
    await user.click(screen.getAllByRole("button", { name: "Verification" })[0]!);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(document.querySelector("#verification")).toHaveClass("settings-card--active");
  });

  it("changes a password through the authenticated contract", async () => {
    const fetchMock = installApi();
    const user = userEvent.setup();
    renderSettings("/settings#account");

    await user.click(await screen.findByRole("button", { name: /Change password/ }));
    await user.type(screen.getByLabelText("Current password"), "old-secret");
    await user.type(screen.getByLabelText("New password"), "new-secret");
    await user.type(screen.getByLabelText("Confirm new password"), "new-secret");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([input, init]) =>
        requestUrl(input).endsWith("/api/v1/auth/password") && requestMethod(input, init) === "PATCH");
      expect(JSON.parse(String(call?.[1]?.body))).toEqual({
        current_password: "old-secret",
        password: "new-secret",
        password_confirmation: "new-secret",
      });
    });
  });

  it("loads blocked users and unblocks without exposing a full profile", async () => {
    const fetchMock = installApi();
    const user = userEvent.setup();
    renderSettings("/settings#blocked");

    expect(await screen.findByText("Lerato")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unblock" }));
    await waitFor(() => expect(screen.queryByText("Lerato")).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([input, init]) =>
      requestUrl(input).endsWith("/api/v1/profiles/blocked-profile/block") && requestMethod(input, init) === "DELETE")).toBe(true);
  });

  it("uses the secure two-step email-change flow", async () => {
    const fetchMock = installApi();
    const user = userEvent.setup();
    renderSettings("/settings#account");

    const masked = await screen.findAllByText("t•••••@example.com");
    const emailButton = masked.map((item) => item.closest("button")).find((item) => item !== null);
    expect(emailButton).not.toBeNull();
    await user.click(emailButton!);
    await user.type(screen.getByLabelText("New email"), "new@example.com");
    await user.type(screen.getByLabelText("Current password"), "current-secret");
    await user.click(screen.getByRole("button", { name: "Send code" }));
    await user.type(await screen.findByLabelText("Verification code"), "123456");
    await user.click(screen.getByRole("button", { name: "Confirm email" }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) =>
      requestUrl(input).endsWith("/api/v1/auth/email/change") && requestMethod(input, init) === "PATCH")).toBe(true));
  });

  it("requires deliberate confirmation before closing the DateZA account", async () => {
    const fetchMock = installApi();
    const user = userEvent.setup();
    renderSettings("/settings#account");

    await user.click(await screen.findByRole("button", { name: /Close account/ }));
    const closeButton = screen.getByRole("button", { name: "Close account permanently" });
    expect(closeButton).toBeDisabled();
    await user.type(screen.getByLabelText("Type “close” to confirm"), "close");
    await user.click(closeButton);

    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) =>
      requestUrl(input).endsWith("/api/v1/me") && requestMethod(input, init) === "DELETE")).toBe(true));
  });
});
