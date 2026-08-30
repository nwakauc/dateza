import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { clearBrandAdminAccessCache } from "../../lib/hq/adminAccess.ts";
import { json, meOk, operatorOk, urlOf } from "../hq/testFixtures.ts";
import { SessionProvider } from "../session/SessionProvider.tsx";
import OpsDashboardPage from "./pages/OpsDashboardPage.tsx";
import { HqOperatorProvider } from "../hq/HqOperatorProvider.tsx";

function overviewOk() {
  return json(200, {
    overview: {
      brand: "dateza",
      generated_at: "2026-08-30T01:00:00Z",
      reports: {
        total: 12,
        by_status: { open: 5, reviewing: 1, actioned: 0, dismissed: 0 },
        awaiting_decision: 3,
        oldest_open_report_at: "2026-08-28T12:00:00Z",
        oldest_open_report_age_seconds: 7200,
        by_reason: {
          inappropriate_content: 0,
          harassment: 0,
          spam: 0,
          fake_profile: 0,
          underage: 0,
          other: 0,
          violence_or_threat: 0,
          non_consensual_content: 0,
          impersonation: 0,
        },
        by_target_type: {
          profile: 0,
          message: 0,
          profile_media: 0,
          hook: 0,
          conversation: 0,
        },
        sla_status: "not_configured",
        overdue: null,
      },
      enforcements: { total: 4, active: 2 },
    },
  });
}

describe("DateZA Operations console", () => {
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

  it("renders real trust & safety metrics on the dashboard", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      if (url.includes("/api/v1/hq/trust_safety/overview")) return overviewOk();
      if (url.includes("/api/v1/hq/trust_safety/repeat_offenders")) {
        return json(200, { repeat_offenders: [], minimum_reports: 2, truncated: false });
      }
      if (url.includes("/api/v1/hq/trust_safety/enforcements")) {
        return json(200, { enforcements: [], next_cursor: null });
      }
      return json(404, { error: "not_found" });
    });

    render(
      <MemoryRouter initialEntries={["/ops"]}>
        <SessionProvider>
          <HqOperatorProvider>
            <Routes>
              <Route path="/ops" element={<OpsDashboardPage />} />
            </Routes>
          </HqOperatorProvider>
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Open reports")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/sla not configured/i)).toBeInTheDocument();
    expect(screen.queryByText(/total users/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/revenue/i)).not.toBeInTheDocument();
  });

  it("loads the brand member directory with pagination", async () => {
    const PROFILE_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      if (url.includes("/api/v1/hq/members/")) return json(404, { error: "not_found" });
      if (url.includes("/api/v1/hq/members")) {
        return json(200, {
          members: [
            {
              user_id: 42,
              profile_id: PROFILE_A,
              display_name: "Naledi",
              user_status: "active",
              membership_status: "active",
              profile_status: "active",
              profile_visibility: "visible",
              joined_at: "2026-08-28T12:00:00Z",
              user_created_at: "2026-08-27T12:00:00Z",
              reports_received_count: 2,
              pending_photo_count: 1,
              active_enforcement: false,
            },
          ],
          next_cursor: null,
        });
      }
      return json(404, { error: "not_found" });
    });

    const OpsUsersPage = (await import("./pages/OpsUsersPage.tsx")).default;

    render(
      <MemoryRouter>
        <SessionProvider>
          <HqOperatorProvider>
            <OpsUsersPage />
          </HqOperatorProvider>
        </SessionProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /find a member/i })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Naledi" })).toHaveAttribute(
      "href",
      `/ops/users/${PROFILE_A}`,
    );
    expect(screen.getByRole("link", { name: "Member 360" })).toBeInTheDocument();
    expect(screen.queryByText(/user directory not yet available/i)).not.toBeInTheDocument();
  });

  it("filters ops navigation by effective capabilities", async () => {
    const { OPS_NAV_ITEMS } = await import("./navConfig.ts");
    const { canAccessOpsNavItem } = await import("./opsCapabilities.ts");
    const operator = (await import("../hq/testFixtures.ts")).operatorFixture({
      effective_capabilities: ["admin.reports.read"],
    });

    const visible = OPS_NAV_ITEMS.filter((item) =>
      canAccessOpsNavItem(operator as never, item),
    ).map((item) => item.id);

    expect(visible).toContain("dashboard");
    expect(visible).toContain("reports");
    expect(visible).not.toContain("users");
    expect(visible).not.toContain("operators");
  });
});
