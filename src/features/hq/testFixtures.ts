import type { HqCapability } from "../../lib/hq/types.ts";

const DEFAULT_CAPABILITIES: HqCapability[] = [
  "hq.member.sensitive_read",
  "hq.member.security_read",
  "hq.discovery_diagnostics.read",
  "hq.trust_safety.read",
  "admin.reports.read",
  "admin.reports.moderate",
  "admin.enforcements.manage",
];

export function operatorFixture(overrides: Record<string, unknown> = {}, mfaVerified = true) {
  return {
    admin_user_id: 10,
    user_id: 1,
    status: "active",
    current_brand: "dateza",
    role: "moderator",
    effective_capabilities: DEFAULT_CAPABILITIES,
    grantable_roles: [],
    brand_assignments: [
      {
        brand: "dateza",
        role: "moderator",
        effective_capabilities: DEFAULT_CAPABILITIES,
      },
    ],
    mfa: {
      state: "active",
      required: true,
      verified: mfaVerified,
      recovery_codes_remaining: 8,
    },
    ...overrides,
  };
}

export function json(status: number, body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

export function meOk() {
  return json(200, {
    user_id: 1,
    brand: { slug: "dateza", name: "DateZA" },
    session: { id: 2, expires_at: "2026-12-01T00:00:00Z", authentication_mode: "bearer" },
    identifier: { kind: "email", verified: true, masked_destination: "o••@d8n.tech" },
    verification_required: false,
    verification: { code_dispatched: false, resend_available_in: 0 },
  });
}

export function operatorOk(mfaVerified = true, overrides: Record<string, unknown> = {}) {
  return json(200, { operator: operatorFixture(overrides, mfaVerified) });
}

export function urlOf(input: RequestInfo | URL): string {
  return typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
}

export function isOperatorProbe(url: string): boolean {
  return url.includes("/api/v1/hq/operator");
}
