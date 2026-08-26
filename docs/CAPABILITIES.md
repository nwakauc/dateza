# DateZA Frontend Capability Cockpit

**Last verified against this repository:** 2026-08-26

This table records evidence, not aspiration. Update it only when a ticket adds
or invalidates the linked implementation and verification. Backend availability
must be confirmed from D8N; a planning document is not production evidence.

D8N dependency columns below were re-verified directly against
`d8n/docs/api/openapi.yaml` ("Implementation status" preamble) and the live
Rails controllers/domain code (`d8n/app/controllers/api/v1/`,
`d8n/domains/profiles/`) on 2026-08-23, not against older DateZA planning
docs — several of those (`MVP_PLAN.md`, `HOLISTIC_PLAN.md`) had drifted stale
and described Discovery/Find/verification as unbuilt when D8N had already
shipped them. See "Known documentation drift" below.

| Capability | Priority | Frontend state | D8N dependency | Verification evidence | Release confidence |
| --- | --- | --- | --- | --- | --- |
| Public responsive landing page | P1 | Implemented | None | lint, typecheck, build | Review in browsers |
| SPA routing and public 404 | P0 | Implemented | None | lint, typecheck, build | Review in browsers |
| Session bootstrap | P0 | Implemented | `GET /api/v1/me` bearer session | `src/features/session/session.test.tsx` | Needs staging host |
| Registration and sessions | P0 | Implemented | Brand-bound password register/login, `DELETE /api/v1/auth/session`, recovery | `src/features/auth/auth.test.tsx` | Needs staging host; reload signs out (memory-only token) |
| Private identity (first/last name) | P0 | Implemented | `configuration.identity_fields`, `PATCH /api/v1/profile` `first_name`/`last_name` (owner-only, never public) | `src/features/onboarding/onboarding.test.tsx` | Needs staging host |
| Profile/onboarding | P0 | Implemented | `GET/PATCH /api/v1/profile`, configuration, preferences, photos, options, publication | `src/features/onboarding/onboarding.test.tsx` | Needs staging host; reload signs out (memory-only token) |
| Safe profile media | P0 | Implemented | Direct-to-R2 upload intent, attach, signed retrieval, delete | `src/features/onboarding/onboarding.test.tsx` photo step | Needs staging R2; DateZA photos stay hidden until moderated; no published max count |
| Post-signup contact verification (email/phone OTP) | P0 | Implemented: registration lands on Discover with the shared OTP modal; lifecycle errors and resend timing are server-driven | `GET /api/v1/me`, `POST/PATCH /api/v1/auth/verification` (contact-only — not RealMe identity verification) | Focused Vitest coverage and local browser QA at 1440/768/390/360 | Needs staging delivery QA |
| Discover | P1 | Curated grid, client-side filters of the daily batch, match rail, complete-profile prompt for DateZA richness (not onboarding publication 100%); no Find fallback | `GET /api/v1/discovery`; `GET /profile` owner fields + photos; `profile_completion` when it reports gaps | `src/features/discovery/DiscoveryPage.test.tsx`, `src/features/profile/richProfileGaps.test.ts` | Needs staging host; server-side Discover modes still missing |
| Find | P1 | Premium three-column Find: swipe deck, Like/Pass, match → conversation, context rail, opener UX stopped at API boundary, notices as activity, same complete-profile prompt as Discover | `GET /api/v1/find` (not Discover); likes/pass; matches/conversation; notifications. **No DateZA opener API** | `src/features/find/FindPage.test.tsx` | Needs staging host; opener/waiting/profile-views are frontend-ready, backend-blocked |
| Profile detail | P1 | Implemented, verification-gated in the UI and API | `GET /api/v1/profiles/{profile_id}` through `InteractionController` | Manual QA | Needs staging host |
| Like/Pass | P1 | Implemented, verification-gated in the UI and API | `POST /api/v1/profiles/{profile_id}/likes`, `POST /api/v1/profiles/{profile_id}/pass` through `InteractionController` | Manual QA | Needs staging host |
| Match | P1 | Match list and start-chat action implemented; match celebration remains unbuilt | `GET /api/v1/matches`, mutual-match response, `POST /api/v1/matches/{id}/conversation` | Browser QA with controlled contract fixtures | Needs staging two-member proof |
| Blocking/reporting | P0 | Not started | Cross-domain safety enforcement | None | Not releasable |
| Match-gated text chat | P1 | Conversation list, history, selection, and bounded text send implemented | Conversation/message APIs; server rate limits and block enforcement; no read receipts or realtime | Browser QA with controlled populated fixtures | Needs staging two-member proof |
| Product notifications | P1 | Inbox, unread count, individual read, and mark-all-read implemented | `GET/PATCH/POST /api/v1/notifications*`; current type set is limited to `dateza.welcome` | Browser QA with controlled unread fixture | Needs staging host |
| Account closure | P0 | Not started | Closure, revocation, purge contract | None | Not releasable |
| RealMe presentation | P1 | Not started | Exact verification assertion contract (distinct from the contact-verification shipped above) | None | Claim prohibited |
| Trust standing | P1 | Not started | Privacy-safe standing contract | None | Claim prohibited |
| Compatibility explanations | P1 | Partial (Find surfaces `dateza_v1` score/confidence/reason codes; no "Why this match?" UI yet) | `dateza_v1` compatibility on `GET /api/v1/find` | Manual QA | Score/confidence shown; reasons not yet rendered |
| Frontend dependency health | P1 | Upgrade required | None | `npm audit` reports 1 high, 1 moderate | Vite major upgrade review required |

States are `Not started`, `In progress`, `Implemented`, and `Verified`. “Verified”
needs evidence that matches the risk: static checks, build, browser and
accessibility QA, plus automated tests when `docs/TESTING.md` says the risk
warrants them. Implementation is not the same as release confidence.

## Previously recorded backend gaps resolved

Re-verification against D8N source on 2026-08-24 found that login-email change
now has request/confirmation endpoints, and profile detail, Like, Pass, Matches,
Conversations, and Messages inherit `Api::V1::InteractionController`, which
enforces contact verification. Older cockpit notes claiming otherwise were
removed rather than carried forward as release blockers.

## Known documentation drift (fixed 2026-08-23)

`docs/MVP_PLAN.md` Journey B previously said D8N "does not yet expose the full
DateZA Find contract or daily 10-profile accounting." That contract
(`GET /api/v1/find`, `FindAllowance` with `limit`/`used`/`remaining`/
`resets_at`, `dateza_v1` compatibility) is implemented now. Treat DateZA
planning docs as a snapshot of intent at time of writing, not live backend
status — re-verify against `d8n/docs/api/openapi.yaml` and, where necessary,
the D8N source before trusting a "not implemented" claim in a dated plan.

## Known engineering debt

- The current Vite 5 dependency chain is affected by one high and one moderate
  development-tool advisory. npm proposes Vite 8, a breaking major upgrade.
  Handle this as a focused upgrade ticket with browser/build verification; do
  not use `npm audit fix --force` inside unrelated work.
- The landing page raw-markup/imperative navigation adapter is presentation debt
  and must not become the authenticated application architecture.
- Bearer tokens remain process-memory only (ADR-0002). A browser reload signs
  the member out until D8N defines a safe persistence mechanism for clients.
