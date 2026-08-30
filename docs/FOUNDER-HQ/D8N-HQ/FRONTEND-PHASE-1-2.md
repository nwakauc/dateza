# D8N HQ — Frontend Phase 1–2

Status: **SHIPPED in DateZA client** (not committed by this handoff). Backend
contracts live in `docs/api/openapi.yaml` (tags `Hq` and `Admin`). Backend
Phase 2 notes: `PHASE-2-IMPLEMENTATION.md`.

## Routes

| Path | Page | Notes |
| --- | --- | --- |
| `/hq` | Command Centre | Honest empty scores; attention rail links to Trust & Safety |
| `/hq/members` | Member search | Phase 1 |
| `/hq/members/:lookup` | Member 360 | Phase 1 |
| `/hq/trust-safety` | Trust & Safety | Tabs via `?tab=overview\|queue\|offenders\|enforcements` |
| `/hq/trust-safety/reports/:reportId` | Report detail | Lifecycle + suspension/reinstatement |

Nav item `trust-safety` is `ready`. `findHqNavItem` resolves
`/hq/trust-safety/reports/:id` to Trust & Safety.

## APIs consumed

### Phase 1 (unchanged)

- `GET /api/v1/hq/members/{lookup}`
- `GET /api/v1/hq/members/{lookup}/security_events`
- `GET /api/v1/hq/members/{lookup}/auth_attempts`
- `GET /api/v1/hq/members/{lookup}/enforcements`
- `GET /api/v1/hq/members/{lookup}/discovery_diagnostic`
- Admin probe: `GET /api/v1/admin/reports?limit=1`

### Phase 2

- `GET /api/v1/hq/trust_safety/overview`
- `GET /api/v1/hq/trust_safety/repeat_offenders?limit=`
- `GET /api/v1/hq/trust_safety/enforcements?state=&cursor=&limit=`
- `GET /api/v1/admin/reports?status=&cursor=&limit=`
- `GET /api/v1/admin/reports/{id}`
- `PATCH /api/v1/admin/reports/{id}` body `{ status, note? }`
- `POST /api/v1/admin/profiles/{profile_id}/suspension` body `{ reason?, report_id? }`
- `DELETE /api/v1/admin/profiles/{profile_id}/suspension`

Brand is always host-derived. No client `brand_id`.

## UI states

| Situation | Behaviour |
| --- | --- |
| Loading | Explicit loading copy per panel |
| Empty | Empty / unavailable primitives; zero maps still render |
| `403` | Forbidden banner; no role inference |
| `404 report_unavailable` | Report unavailable; no existence claims |
| `404 member_unavailable` / `profile_unavailable` | Existing Member 360 copy |
| `409 already_suspended` / `not_suspended` / `report_conflict` | Action error; no optimistic success |
| `422 invalid_cursor` / `invalid_filter` / `invalid_limit` / `invalid_transition` | Validation / action error; enforcement invalid cursor is **not** silently reset |
| `5xx` / parse failure | Error + manual retry; never substitute fake zeros |
| SLA | Always `sla_status: not_configured`; `overdue: null` never shown as `0 overdue` |

Overview loads first on Trust & Safety. Queue, repeat offenders, and
enforcements load on demand when their tab is selected.

## Limitations (honest)

- No SLA overdue numbers or reports-per-1,000 inventing.
- No reason / target-type queue filters (overview breakdowns only).
- Repeat offenders are bounded + `truncated`, not cursor-paginated.
- No case timeline, conversation browser, or verification surface.
- No cross-brand / “All Company” rollups.
- Writes remain under `/api/v1/admin/*`; HQ Phase 2 adds reads + UI chrome.

## Tests

- `src/features/hq/hq.test.tsx` — Phase 1 Member 360 / shell
- `src/features/hq/trustSafety.test.tsx` — Phase 2 overview, queue, detail,
  offenders, enforcements, moderation success/failure, 403, 404

Run:

```sh
npx vitest run src/features/hq
npm run lint
npm run typecheck
```
