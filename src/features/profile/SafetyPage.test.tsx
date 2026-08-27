import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  return input instanceof URL ? input.href : input.url;
}

function methodOf(input: RequestInfo | URL, init?: RequestInit): string {
  return init?.method ?? (input instanceof Request ? input.method : "GET");
}

function installApi({ blocks = true }: { blocks?: boolean } = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = urlOf(input);
    const method = methodOf(input, init);
    if (url.endsWith("/api/v1/me")) return Promise.resolve(json({
      user_id: 42,
      brand: { slug: "dateza", name: "DateZA" },
      session: { id: 7, expires_at: "2026-12-01T00:00:00Z" },
      identifier: { kind: "email", verified: true, masked_destination: "t•••••@example.com" },
      verification_required: false,
      verification: { code_dispatched: false, resend_available_in: 0 },
    }));
    if (url.endsWith("/api/v1/profile") && method === "GET") return Promise.resolve(json({
      profile: {
        id: "owner-profile",
        brand: { slug: "dateza", name: "DateZA" },
        status: "active",
        visibility: "visible",
        display_name: "Thando",
        city: "Cape Town",
        verification: { contact: { verified: true } },
      },
      onboarding: {
        state: "complete",
        next_step: null,
        profile_exists: true,
        profile_complete: true,
        profile_published: true,
        completion: { complete: true, percent: 100, missing: [] },
      },
    }));
    if (url.endsWith("/api/v1/profile/photos")) return Promise.resolve(json({ photos: [] }));
    if (url.endsWith("/api/v1/notifications")) return Promise.resolve(json({ notifications: [], unread_count: 0 }));
    if (url.endsWith("/api/v1/blocks") && method === "GET") {
      return blocks
        ? Promise.resolve(json({ blocks: [{ profile: { id: "blocked-1", display_name: "Lerato" }, blocked_at: "2026-08-20T12:00:00Z" }] }))
        : Promise.resolve(json({ error: "unavailable" }, 503));
    }
    if (url.endsWith("/api/v1/profiles/blocked-1/block") && method === "DELETE") {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    if (url.endsWith("/api/v1/profile/publication") && method === "DELETE") {
      return Promise.resolve(json({}));
    }
    return Promise.resolve(json({ error: "not_found" }, 404));
  });
}

describe("SafetyPage", () => {
  beforeEach(() => setBearerToken("safety-test-token"));

  it("renders authoritative safety state and manages blocked members", async () => {
    const fetchMock = installApi();
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/settings/safety"]}><App /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Safety centre" })).toBeInTheDocument();
    expect(screen.getByText("Verified contact")).toBeInTheDocument();
    expect(screen.getByText("Your exact location stays private")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Blocked users/ }));
    expect(await screen.findByText("Lerato")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Unblock" }));
    await waitFor(() => expect(screen.queryByText("Lerato")).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([input, init]) =>
      urlOf(input).endsWith("/api/v1/profiles/blocked-1/block") && methodOf(input, init) === "DELETE")).toBe(true);
  });

  it("explains how to report from a profile instead of sending the member to chats", async () => {
    installApi();
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/settings/safety"]}><App /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Safety centre" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /report a member/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "How to report someone" })).not.toBeInTheDocument();

    const report = screen.getByRole("button", { name: /report a member/i });
    expect(report).toHaveAttribute("aria-expanded", "false");
    await user.click(report);

    expect(report).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByRole("heading", { name: "How to report someone" })).toBeInTheDocument();
    expect(screen.getByText(/open their profile and choose/i)).toBeInTheDocument();
    expect(screen.getByText(/can't look someone up from the safety centre/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Discover" })).toHaveAttribute("href", "/discover");
    expect(screen.getByRole("link", { name: "Go to Find" })).toHaveAttribute("href", "/find");
  });

  it("keeps safety guidance usable when the block list fails", async () => {
    installApi({ blocks: false });
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/settings/safety"]}><App /></MemoryRouter>);

    expect(await screen.findByText("Stay alert without losing the spark")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Blocked users/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't load your blocked members");
    expect(screen.getAllByText("Dating safety guide").length).toBeGreaterThan(0);
  });

  it("pauses profile visibility through the publication contract", async () => {
    const fetchMock = installApi();
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/settings/safety"]}><App /></MemoryRouter>);

    await user.click(await screen.findByRole("button", { name: /Pause dating/ }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([input, init]) =>
      urlOf(input).endsWith("/api/v1/profile/publication") && methodOf(input, init) === "DELETE")).toBe(true));
  });
});
