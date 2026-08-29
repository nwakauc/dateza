import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "../session/SessionProvider.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { clearBrandAdminAccessCache } from "../../lib/hq/adminAccess.ts";
import { OwnAccountContext, type OwnAccount } from "./OwnAccountContext.ts";
import { MobileHeader } from "./MobileHeader.tsx";
import { TopNav } from "./TopNav.tsx";

const account: OwnAccount = {
  loading: false,
  profile: null,
  onboarding: null,
  avatarUrl: null,
  photoCount: 0,
  displayName: "Naledi",
  initial: "N",
  unreadNotifications: 0,
  unreadChats: 0,
  refresh: () => undefined,
};

function json(status: number, body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function meOk() {
  return json(200, {
    user_id: 1,
    brand: { slug: "dateza", name: "DateZA" },
    session: { id: 2, expires_at: "2026-12-01T00:00:00Z", authentication_mode: "bearer" },
    identifier: { kind: "email", verified: true, masked_destination: "o••@d8n.tech" },
    verification_required: false,
    verification: { code_dispatched: false, resend_available_in: 0 },
  });
}

describe("HQ entry visibility", () => {
  beforeEach(() => {
    setBearerToken("opaque-token");
    clearBrandAdminAccessCache();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    setBearerToken(undefined);
    clearBrandAdminAccessCache();
  });

  it("shows an HQ chip for brand admins", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/admin/reports")) return json(200, { reports: [], next_cursor: null });
      return json(404, { error: "not_found" });
    });

    render(
      <MemoryRouter>
        <SessionProvider>
          <OwnAccountContext.Provider value={account}>
            <TopNav account={account} />
          </OwnAccountContext.Provider>
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: /open d8n hq/i })).toHaveAttribute("href", "/hq");
  });

  it("hides HQ entry for ordinary members", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/admin/reports")) return json(403, { error: "forbidden" });
      return json(404, { error: "not_found" });
    });

    render(
      <MemoryRouter>
        <SessionProvider>
          <OwnAccountContext.Provider value={account}>
            <TopNav account={account} />
          </OwnAccountContext.Provider>
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: /notifications/i })).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(
        vi.mocked(fetch).mock.calls.some((call) => String(call[0]).includes("/api/v1/admin/reports")),
      ).toBe(true);
    });
    expect(screen.queryByRole("link", { name: /open d8n hq/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /d8n hq/i })).not.toBeInTheDocument();
  });

  it("offers D8N HQ in the mobile account menu for admins", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation((input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/admin/reports")) return json(200, { reports: [], next_cursor: null });
      return json(404, { error: "not_found" });
    });

    render(
      <MemoryRouter initialEntries={["/discover"]}>
        <SessionProvider>
          <MobileHeader account={account} />
        </SessionProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /open menu/i }));
    expect(await screen.findByRole("link", { name: /d8n hq/i })).toHaveAttribute("href", "/hq");
  });
});
