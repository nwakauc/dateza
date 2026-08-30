import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../App.tsx";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { clearBrandAdminAccessCache } from "../../lib/hq/adminAccess.ts";
import { lookupHqMember } from "../../lib/hq/api.ts";
import { json, meOk, operatorOk, urlOf } from "./testFixtures.ts";

function withOperator(
  handler: (url: string) => ReturnType<typeof json> | undefined,
  mfaVerified = true,
) {
  return (input: RequestInfo | URL) => {
    const url = urlOf(input);
    if (url.includes("/api/v1/me")) return meOk();
    if (url.includes("/api/v1/hq/operator")) return operatorOk(mfaVerified);
    return handler(url) ?? json(404, { error: "not_found" });
  };
}

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";

function member360Ok(overrides: Record<string, unknown> = {}) {
  return json(200, {
    member: {
      user_id: 99,
      profile_id: PROFILE_ID,
      brand: "dateza",
      membership_status: "active",
    },
    sections: {
      identity: {
        user_id: 99,
        user_status: "active",
        first_name: "Lebo",
        last_name: "Molefe",
        user_created_at: "2026-01-01T00:00:00Z",
        membership_status: "active",
        member_since: "2026-01-02T00:00:00Z",
        identifiers: [
          {
            kind: "email",
            value: "lebo@example.com",
            verified_at: "2026-01-02T00:00:00Z",
            last_seen_at: null,
          },
        ],
        recent_sessions: [],
      },
      profile: {
        exists: true,
        public_id: PROFILE_ID,
        display_name: "Lebo",
        status: "active",
        visibility: "visible",
        gender: "woman",
        birthdate: "1995-04-01",
        country_code: "ZA",
        city: "Cape Town",
        created_at: "2026-01-02T00:00:00Z",
        onboarding_state: "complete",
        onboarding_next_step: null,
        onboarding_completion_percent: 100,
        photo_count: 0,
        photos: [],
        preference: null,
      },
      product: {
        likes_given: 4,
        likes_received: 2,
        matches_active: 1,
        hooks_sent: 0,
        hooks_received: 0,
        hooks_live_sent: 0,
        hooks_live_received: 0,
        hook_tonight_live: false,
        conversations_count: 1,
        recent_conversations: [],
        blocks_given: 0,
        blocks_received: 0,
      },
      comms: {
        delivery_counts_by_status: { sent: 1 },
        delivery_counts_by_channel: { email: 1 },
        recent_deliveries: [],
      },
      safety: {
        reports_filed_count: 0,
        reports_received_count: 0,
        recent_reports: [],
        active_enforcement: null,
        enforcement_count: 0,
        account_closure: null,
      },
      activity: {
        last_login_at: "2026-08-01T12:00:00Z",
        recent_auth_attempts: [
          {
            kind: "password",
            result: "succeeded",
            ip_address: "1.2.3.4",
            created_at: "2026-08-01T12:00:00Z",
          },
        ],
        recent_security_events: [
          {
            event_type: "hq.member_360_viewed",
            severity: "info",
            created_at: "2026-08-01T12:01:00Z",
          },
        ],
      },
    },
    ...overrides,
  });
}

function member360NoProfile() {
  return json(200, {
    member: {
      user_id: 50,
      profile_id: null,
      brand: "dateza",
      membership_status: "active",
    },
    sections: {
      identity: {
        user_id: 50,
        user_status: "active",
        first_name: null,
        last_name: null,
        user_created_at: "2026-01-01T00:00:00Z",
        membership_status: "active",
        member_since: "2026-01-02T00:00:00Z",
        identifiers: [],
        recent_sessions: [],
      },
      profile: { exists: false },
      product: {
        likes_given: 0,
        likes_received: 0,
        matches_active: 0,
        hooks_sent: 0,
        hooks_received: 0,
        hooks_live_sent: 0,
        hooks_live_received: 0,
        hook_tonight_live: false,
        conversations_count: 0,
        recent_conversations: [],
        blocks_given: 0,
        blocks_received: 0,
      },
      comms: {
        delivery_counts_by_status: {},
        delivery_counts_by_channel: {},
        recent_deliveries: [],
      },
      safety: {
        reports_filed_count: 0,
        reports_received_count: 0,
        recent_reports: [],
        active_enforcement: null,
        enforcement_count: 0,
        account_closure: null,
      },
      activity: {
        last_login_at: null,
        recent_auth_attempts: [],
        recent_security_events: [],
      },
    },
  });
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("D8N HQ Phase 1 integration", () => {
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

  it("redirects unauthenticated operators from /hq to sign-in", async () => {
    setBearerToken(undefined);
    vi.mocked(fetch).mockImplementation(() => json(401, { error: "unauthorized" }));
    renderAt("/hq");
    expect(
      await screen.findByRole("heading", { name: /welcome back/i }, { timeout: 5000 }),
    ).toBeInTheDocument();
  });

  it("blocks signed-in non-operators from /hq", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return json(403, { error: "forbidden" });
      return json(404, { error: "not_found" });
    });
    renderAt("/hq");
    expect(
      await screen.findByRole("heading", { name: /hq is for authorized operators/i }),
    ).toBeInTheDocument();
  });

  it("requires MFA step-up before loading HQ surfaces", async () => {
    vi.mocked(fetch).mockImplementation(withOperator(() => undefined, false));
    renderAt("/hq");
    expect(await screen.findByRole("heading", { name: /confirm it is you/i })).toBeInTheDocument();
  });

  it("shows host brand context without inventing All Company", async () => {
    vi.mocked(fetch).mockImplementation(withOperator(() => undefined));
    renderAt("/hq");
    expect(await screen.findByLabelText("Brand context")).toHaveTextContent(/DateZA/i);
    expect(screen.queryByRole("option", { name: /all company/i })).not.toBeInTheDocument();
  });

  it("offers a return path to DateZA from HQ", async () => {
    vi.mocked(fetch).mockImplementation(withOperator(() => undefined));
    renderAt("/hq");
    expect(await screen.findByRole("heading", { name: "Command Centre" })).toBeInTheDocument();
    const exits = screen.getAllByRole("link", { name: /back to dateza/i });
    expect(exits.length).toBeGreaterThan(0);
    for (const link of exits) {
      expect(link).toHaveAttribute("href", "/discover");
    }
  });

  it("looks up a member and navigates to Member 360 via profile public id", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(
      withOperator((url) => {
      if (url.includes("/api/v1/hq/members/")) {
        if (url.includes("/discovery_diagnostic")) {
          return json(200, {
            eligible: true,
            ineligibility_reason: null,
            stages: [
              {
                stage: "visible_active_profiles",
                description: "Visible active profiles",
                candidate_count: 100,
              },
              {
                stage: "reciprocal_gender_age_distance",
                description: "After reciprocal gender, age, and distance filters",
                candidate_count: 40,
              },
              {
                stage: "final_eligible_candidates",
                description: "After exclusions",
                candidate_count: 3,
              },
            ],
          });
        }
        return member360Ok();
      }
      return undefined;
      }),
    );

    renderAt("/hq/members");
    await screen.findByLabelText(/member lookup/i);
    await user.type(screen.getByLabelText(/member lookup/i), "lebo@example.com");
    await user.click(screen.getByRole("button", { name: /look up/i }));

    expect(await screen.findByRole("heading", { name: "Lebo" })).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(PROFILE_ID)).length).toBeGreaterThan(0);
    expect(screen.getByText(/likes given/i)).toBeInTheDocument();
  });

  it("shows unknown lookup as not found without enumeration claims", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      if (url.includes("/api/v1/hq/members/")) return json(404, { error: "member_unavailable" });
      return json(404, { error: "not_found" });
    });
    renderAt("/hq/members");
    await screen.findByLabelText(/member lookup/i);
    await user.type(screen.getByLabelText(/member lookup/i), "missing@example.com");
    await user.click(screen.getByRole("button", { name: /look up/i }));
    expect(await screen.findByText(/no member found/i)).toBeInTheDocument();
    expect(screen.getByText(/unauthorized-brand/i)).toBeInTheDocument();
  });

  it("surfaces forbidden on lookup", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      if (url.includes("/api/v1/hq/members/")) return json(403, { error: "forbidden" });
      return json(404, { error: "not_found" });
    });
    renderAt("/hq/members");
    await screen.findByLabelText(/member lookup/i);
    await user.type(screen.getByLabelText(/member lookup/i), "x@example.com");
    await user.click(screen.getByRole("button", { name: /look up/i }));
    expect(await screen.findByText(/not authorized for this action/i)).toBeInTheDocument();
  });

  it("renders profile-not-existing state from exists:false", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      if (url.includes("/discovery_diagnostic")) {
        return json(404, { error: "profile_unavailable" });
      }
      if (url.includes("/api/v1/hq/members/")) return member360NoProfile();
      return json(404, { error: "not_found" });
    });

    renderAt(`/hq/members/no-profile-user@example.com?sections=profile,product`);
    expect(await screen.findByText("This member has no profile yet")).toBeInTheDocument();
    expect(screen.getByText(/sections.profile.exists is false/i)).toBeInTheDocument();
  });

  it("loads security event history on demand with pagination", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      if (url.includes("/security_events")) {
        if (url.includes("cursor=")) {
          return json(200, {
            security_events: [
              {
                id: 2,
                event_type: "admin.report_viewed",
                severity: "warning",
                metadata: {},
                ip_address: null,
                created_at: "2026-07-01T00:00:00Z",
              },
            ],
            next_cursor: null,
          });
        }
        return json(200, {
          security_events: [
            {
              id: 1,
              event_type: "hq.security_events_page_loaded",
              severity: "info",
              metadata: { admin_user_id: 1 },
              ip_address: "9.9.9.9",
              created_at: "2026-08-01T00:00:00Z",
            },
          ],
          next_cursor: "cursor-a",
        });
      }
      if (url.includes("/discovery_diagnostic")) {
        return json(200, { eligible: false, ineligibility_reason: "profile_incomplete", stages: [] });
      }
      if (url.includes("/api/v1/hq/members/")) return member360Ok();
      return json(404, { error: "not_found" });
    });

    renderAt(`/hq/members/${PROFILE_ID}?sections=activity`);
    expect(await screen.findByRole("heading", { name: "Lebo" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /load security history/i }));
    expect(await screen.findByText("hq.security_events_page_loaded")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /load more/i }));
    expect(await screen.findByText("admin.report_viewed")).toBeInTheDocument();
  });

  it("loads auth attempts and enforcement history on demand", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      if (url.includes("/auth_attempts")) {
        return json(200, {
          auth_attempts: [
            {
              id: 9,
              kind: "password",
              result: "failed",
              identifier: "lebo@example.com",
              ip_address: "1.1.1.1",
              created_at: "2026-08-02T00:00:00Z",
            },
          ],
          next_cursor: null,
        });
      }
      if (url.includes("/enforcements")) {
        return json(200, {
          enforcements: [
            {
              id: 3,
              state: "reverted",
              profile_id: PROFILE_ID,
              reason: "policy",
              report_id: 8,
              admin_user_id: 1,
              reverted_by_admin_user_id: 1,
              created_at: "2026-07-01T00:00:00Z",
              reverted_at: "2026-07-02T00:00:00Z",
            },
          ],
          next_cursor: null,
        });
      }
      if (url.includes("/discovery_diagnostic")) {
        return json(200, { eligible: true, ineligibility_reason: null, stages: [] });
      }
      if (url.includes("/api/v1/hq/members/")) return member360Ok();
      return json(404, { error: "not_found" });
    });

    renderAt(`/hq/members/${PROFILE_ID}?sections=activity,safety`);
    await screen.findByRole("heading", { name: "Lebo" });

    const authButtons = screen.getAllByRole("button", { name: /load auth history/i });
    await user.click(authButtons[0]!);
    expect(await screen.findByText("lebo@example.com")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /load full history/i }));
    expect(await screen.findByText("policy")).toBeInTheDocument();
  });

  it("renders discovery diagnostic stages without inventing gender/age/distance splits", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      if (url.includes("/discovery_diagnostic")) {
        return json(200, {
          eligible: true,
          ineligibility_reason: null,
          stages: [
            {
              stage: "visible_active_profiles",
              description: "Visible active profiles",
              candidate_count: 100,
            },
            {
              stage: "reciprocal_gender_age_distance",
              description: "After reciprocal gender, age, and distance filters",
              candidate_count: 40,
            },
            {
              stage: "final_eligible_candidates",
              description: "After exclusions",
              candidate_count: 3,
            },
          ],
        });
      }
      if (url.includes("/api/v1/hq/members/")) return member360Ok();
      return json(404, { error: "not_found" });
    });

    renderAt(`/hq/members/${PROFILE_ID}?sections=product`);
    expect(await screen.findByText(/reciprocal gender, age, and distance/i)).toBeInTheDocument();
    expect(screen.getByText("reciprocal_gender_age_distance")).toBeInTheDocument();
    expect(screen.queryByText(/^Gender filter$/i)).not.toBeInTheDocument();
    expect(screen.getByText("Ultimately remaining")).toBeInTheDocument();
  });

  it("preserves section URL state", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      if (url.includes("/discovery_diagnostic")) {
        return json(200, { eligible: false, ineligibility_reason: "suspended", stages: [] });
      }
      if (url.includes("/api/v1/hq/members/")) return member360Ok();
      return json(404, { error: "not_found" });
    });

    renderAt(`/hq/members/${PROFILE_ID}?sections=identity,product`);
    const product = await screen.findByRole("button", { name: /product/i });
    expect(product).toHaveAttribute("aria-expanded", "true");
    expect(within(product.closest("section")!).getByText(/likes given/i)).toBeInTheDocument();
  });

  it("shows backend failure on Member 360 load", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      if (url.includes("/api/v1/hq/members/")) return json(500, { error: "server_error" });
      return json(404, { error: "not_found" });
    });
    renderAt(`/hq/members/${PROFILE_ID}`);
    expect(await screen.findByRole("heading", { name: /could not load member 360/i })).toBeInTheDocument();
  });

  it("does not invent Command Centre metrics", async () => {
    vi.mocked(fetch).mockImplementation((input) => {
      const url = urlOf(input);
      if (url.includes("/api/v1/me")) return meOk();
      if (url.includes("/api/v1/hq/operator")) return operatorOk();
      return json(404, { error: "not_found" });
    });
    renderAt("/hq");
    expect(await screen.findByRole("heading", { name: "Command Centre" })).toBeInTheDocument();
    expect(screen.queryByText(/\b72\/100\b/)).not.toBeInTheDocument();
  });
});

describe("HQ API adapter", () => {
  it("rejects empty lookup", async () => {
    await expect(lookupHqMember("   ")).rejects.toMatchObject({ status: 400 });
  });
});
