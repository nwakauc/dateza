import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App.tsx";
import { setBearerToken } from "../lib/api/tokenStore.ts";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("SPA routes", () => {
  it("renders the existing landing experience at /", () => {
    renderAt("/");

    expect(
      screen.getByRole("heading", { level: 1, name: /meet someone/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /girls are waiting/i })).toHaveAttribute("href", "/sign-up");
    expect(screen.getByRole("link", { name: /^how it works$/i })).toHaveAttribute("href", "/how-it-works");
  });

  it("keeps marketing hashes on the landing page", () => {
    renderAt("/#discover");

    expect(
      screen.getByRole("heading", { level: 1, name: /meet someone/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /page not found/i }),
    ).not.toBeInTheDocument();
  });

  it("renders an accessible Not Found page for unknown paths", async () => {
    renderAt("/this-route-does-not-exist");

    expect(
      await screen.findByRole("heading", { level: 1, name: /page not found/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to home/i }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /join free/i })).toHaveAttribute("href", "/sign-up");
  });

  it("returns to the landing page from Not Found", async () => {
    const user = userEvent.setup();
    renderAt("/this-route-does-not-exist");

    await user.click(await screen.findByRole("link", { name: /back to home/i }));

    expect(
      screen.getByRole("heading", { level: 1, name: /meet someone/i }),
    ).toBeInTheDocument();
  });

  it.each([
    ["/how-it-works", /create a profile/i],
    ["/dating-safely", /date like you have somewhere/i],
    ["/stories", /the point is a real date/i],
    ["/lifestyle", /dates that look like this country/i],
    ["/privacy", /your dating life stays yours/i],
    ["/help", /how to get going/i],
    ["/careers", /building dateza/i],
    ["/cities", /across sa/i],
    ["/get-the-app", /ready in your browser/i],
  ] as const)("renders the public %s page", (path, heading) => {
    renderAt(path);
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join dateza free/i })).toHaveAttribute("href", "/sign-up");
  });
});

describe("signed-in unknown paths", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    setBearerToken("opaque-token");
    vi.mocked(fetch).mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const json = (status: number, body: unknown) =>
        Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
      if (url.endsWith("/api/v1/me")) {
        return json(200, {
          user_id: 1,
          brand: { slug: "dateza", name: "DateZA" },
          session: { id: 2, expires_at: "2026-12-01T00:00:00Z" },
          identifier: { kind: "email", verified: true, masked_destination: "t••@example.com" },
          verification_required: false,
          verification: { code_dispatched: false, resend_available_in: 0 },
        });
      }
      if (url.endsWith("/api/v1/profile")) {
        return json(200, {
          profile: { id: "owner", display_name: "Thando", options: {}, status: "active", visibility: "visible" },
          onboarding: {
            state: "complete",
            next_step: null,
            profile_exists: true,
            profile_complete: true,
            profile_published: true,
            completion: { complete: true, percent: 100, missing: [] },
          },
        });
      }
      if (url.endsWith("/api/v1/profile/photos")) return json(200, { photos: [] });
      if (url.endsWith("/api/v1/notifications")) return json(200, { notifications: [], unread_count: 0, next_cursor: null });
      return json(404, { error: "not_found" });
    });
  });

  afterEach(() => {
    setBearerToken(undefined);
    vi.unstubAllGlobals();
  });

  it("keeps signed-in chrome on unknown paths instead of Join and Sign in", async () => {
    renderAt("/this-route-does-not-exist");

    expect(await screen.findByRole("heading", { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to discover/i })).toHaveAttribute("href", "/discover");
    expect(screen.queryByRole("link", { name: /join free/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^sign in$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
