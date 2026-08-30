# D8N HQ — Frontend Phase 1–2

Status: **SHIPPED in DateZA client** (not committed by this handoff). Backend
contracts live in `docs/api/openapi.yaml` (tags `Hq` and `Admin`). Backend
Phase 2 notes: `PHASE-2-IMPLEMENTATION.md`. Foundation/security handoff:
`FOUNDATION-SECURITY-IMPLEMENTATION.md`.

## DateZA Operations console (`/ops`)

Separate from the dark D8N HQ Command Centre (`/hq`). This is the DateZA-branded,
day-to-day admin surface for brand operators (reports, photos, member lookup,
trust & safety).

| Path | Page | Capability gate (nav) |
| --- | --- | --- |
| `/ops` | Dashboard | any authorized operator |
| `/ops/users` | Member search | `hq.member.sensitive_read` |
| `/ops/users/:lookup` | Member 360 | same (route) |
| `/ops/reports` | Report queue | `admin.reports.read` |
| `/ops/reports/:reportId` | Report detail | same; transitions need `admin.reports.moderate` |
| `/ops/photos` | Photo moderation queue | `admin.profile_photos.moderate` |
| `/ops/safety` | Trust & Safety overview | `hq.trust_safety.read` |
| `/ops/activity` | Member activity lookup | `hq.member.security_read` |
| `/ops/operators` | Operator assignments | `admin.operators.read` (+ manage actions need `admin.operators.manage`) |

Consumer shell entry: `OpsEntryLink` (chip + account menus) when
`GET /api/v1/hq/operator` succeeds — same probe as HQ. HQ sidebar links back to
`/ops` as “DateZA Admin”.

Dashboard metrics use only verified endpoints (overview, photo queue length,
repeat offenders, recent enforcements). No signup, revenue, health, or activity
fabrication. Growth rollups (signups, active members, gender split) require a
future `GET /api/v1/hq/analytics/overview` (`hq.analytics.read`). The dashboard
shows honest NOT CONFIGURED cards until that ships; newest members come from the
member directory.

Additional APIs used by `/ops` only:

- `GET /api/v1/hq/members` — brand directory (cursor pagination, optional `status`)
- `GET /api/v1/hq/analytics/overview` — **REQUESTED, not implemented** (signups,
  active members, gender split, brand timezone week/month boundaries)
- `GET /api/v1/admin/profile_photos`
- `PATCH /api/v1/admin/profile_photos/{id}`
- `GET /api/v1/hq/operators`
- `POST /api/v1/hq/operators`
- `PATCH /api/v1/hq/operators/{id}`

## D8N HQ routes (`/hq`)

| Path | Page | Notes |
| --- | --- | --- |
| `/hq` | Command Centre | Honest empty scores; attention rail links to Trust & Safety |
| `/hq/members` | Member search | Phase 1 |
| `/hq/members/:lookup` | Member 360 | Phase 1 |
| `/hq/trust-safety` | Trust & Safety | Tabs via `?tab=overview\|queue\|offenders\|enforcements` |
| `/hq/trust-safety/reports/:reportId` | Report detail | Lifecycle + suspension/reinstatement |

MFA enrollment/challenge is inline inside `/hq` (no separate route). Operators
with `mfa.verified: false` see the step-up screen before HQ surfaces load.

Nav item `trust-safety` is `ready`. `findHqNavItem` resolves
`/hq/trust-safety/reports/:id` to Trust & Safety. Sidebar items are filtered by
`effective_capabilities`, never role labels.

## APIs consumed

### Foundation / security (Phase 0)

- `GET /api/v1/hq/operator` — bootstrap probe, capabilities, MFA state
- `POST /api/v1/hq/mfa/enrollment` — start TOTP enrollment
- `PATCH /api/v1/hq/mfa/enrollment` — confirm enrollment; recovery codes once
- `POST /api/v1/hq/mfa/challenge` — session step-up with TOTP or recovery code

Consumer-shell HQ entry and `/hq` route gate use `GET /api/v1/hq/operator`
(200 = show entry; 403 = hide/block). MFA is not required for the probe.

### Phase 1

- `GET /api/v1/hq/members` — brand directory (cursor pagination, optional `status`)
- `GET /api/v1/hq/members/{lookup}`
- `GET /api/v1/hq/members/{lookup}/security_events`
- `GET /api/v1/hq/members/{lookup}/auth_attempts`
- `GET /api/v1/hq/members/{lookup}/enforcements`
- `GET /api/v1/hq/members/{lookup}/discovery_diagnostic`

### Phase 2

- `GET /api/v1/hq/trust_safety/overview`
- `GET /api/v1/hq/trust_safety/repeat_offenders?limit=`
- `GET /api/v1/hq/trust_safety/enforcements?state=&cursor=&limit=`
- `GET /api/v1/admin/reports?status=&cursor=&limit=`
- `GET /api/v1/admin/reports/{id}`
- `PATCH /api/v1/admin/reports/{id}` body `{ status, note? }`
- `POST /api/v1/admin/profiles/{profile_id}/suspension` body `{ reason?, report_id? }`
- `DELETE /api/v1/admin/profiles/{profile_id}/suspension`

Brand is always host-derived. No client `brand_id`. Navigation and actions use
`effective_capabilities` from the operator response.

## UI states

| Situation | Behaviour |
| --- | --- |
| Loading | Explicit loading copy per panel |
| Empty | Empty / unavailable primitives; zero maps still render |
| `401` | Re-authenticate |
| `403 forbidden` | Unauthorized/revoked; not an MFA prompt |
| `403 admin_mfa_required` | MFA challenge (protected HQ/admin calls) |
| `404 report_unavailable` | Report unavailable; no existence claims |
| `404 member_unavailable` / `profile_unavailable` | Existing Member 360 copy |
| `409 already_suspended` / `not_suspended` / `report_conflict` | Action error; no optimistic success |
| `422 admin_mfa_code_invalid` | Recoverable MFA validation error |
| `429 admin_mfa_rate_limited` | Retry after server `Retry-After` |
| `422 invalid_cursor` / `invalid_filter` / `invalid_limit` / `invalid_transition` | Validation / action error |
| `5xx` / parse failure | Error + manual retry; never substitute fake zeros |
| SLA | Always `sla_status: not_configured`; `overdue: null` never shown as `0 overdue` |
| MFA `not_enrolled` / `pending` | Enrollment flow with one-time secret display |
| MFA `active` + `verified: false` | TOTP/recovery challenge before HQ loads |

Overview loads first on Trust & Safety. Queue, repeat offenders, and
enforcements load on demand when their tab is selected.

Enrollment secrets, TOTP codes, and recovery codes are never stored in
localStorage, logged, or sent to analytics.

## Limitations (honest)

- No operator-management UI in `/hq` (available under `/ops/operators` when entitled).
- No SLA overdue numbers or reports-per-1,000 inventing.
- No reason / target-type queue filters (overview breakdowns only).
- Repeat offenders are bounded + `truncated`, not cursor-paginated.
- No case timeline, conversation browser, or verification surface.
- No cross-brand / “All Company” rollups.
- Writes remain under `/api/v1/admin/*`; HQ Phase 2 adds reads + UI chrome.

## Tests

- `src/features/hq/hq.test.tsx` — Phase 1 Member 360 / shell / MFA gate
- `src/features/hq/trustSafety.test.tsx` — Phase 2 overview, queue, detail,
  offenders, enforcements, moderation success/failure, 403, 404
- `src/features/shell/hqEntry.test.tsx` — consumer HQ + Admin entry via operator probe
- `src/features/ops/ops.test.tsx` — ops dashboard metrics, capability nav, users search-first
- `src/features/hq/testFixtures.ts` — shared operator/session mocks

Run:

```sh
npx vitest run src/features/hq src/features/ops src/features/shell/hqEntry.test.tsx
npm run lint
npm run typecheck
npm run build
```
