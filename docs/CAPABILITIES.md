# DateZA Frontend Capability Cockpit

**Last verified against this repository:** 2026-08-23

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
| Post-signup contact verification (email/phone OTP) | P0 | Implemented | `POST/PATCH /api/v1/auth/verification` (D8N: implemented now, contact-only — not RealMe identity verification) | Manual QA; no automated test yet | Needs staging host |
| Discovery (DateZA's browse surface) | P1 | Implemented | `GET /api/v1/find` — **not** `GET /api/v1/discovery`, which is deliberately unconfigured for the `dateza` brand per the openapi preamble | Manual QA; no automated test yet | Needs staging host |
| Profile detail | P1 | Implemented, verification-gated in the UI | `GET /api/v1/profiles/{profile_id}` | Manual QA | D8N does not itself enforce contact-verification on this endpoint — see gap below |
| Like/Pass | P1 | Implemented, verification-gated in the UI | `POST /api/v1/profiles/{profile_id}/likes`, `POST /api/v1/profiles/{profile_id}/pass` | Manual QA | D8N does not itself enforce contact-verification on either endpoint — see gap below |
| Match | P1 | Not started (Like response surfaces `matched`/`match_id`; no match list/celebration UI yet) | `POST /api/v1/profiles/{id}/likes` mutual-match detection | None | Not releasable |
| Blocking/reporting | P0 | Not started | Cross-domain safety enforcement | None | Not releasable |
| Match-gated text chat | P1 | Not started | Messaging, rate limits, block enforcement | None | Not releasable |
| Account closure | P0 | Not started | Closure, revocation, purge contract | None | Not releasable |
| RealMe presentation | P1 | Not started | Exact verification assertion contract (distinct from the contact-verification shipped above) | None | Claim prohibited |
| Trust standing | P1 | Not started | Privacy-safe standing contract | None | Claim prohibited |
| Compatibility explanations | P1 | Partial (Find surfaces `dateza_v1` score/confidence/reason codes; no "Why this match?" UI yet) | `dateza_v1` compatibility on `GET /api/v1/find` | Manual QA | Score/confidence shown; reasons not yet rendered |
| Frontend dependency health | P1 | Upgrade required | None | `npm audit` reports 1 high, 1 moderate | Vite major upgrade review required |

States are `Not started`, `In progress`, `Implemented`, and `Verified`. “Verified”
needs evidence that matches the risk: static checks, build, browser and
accessibility QA, plus automated tests when `docs/TESTING.md` says the risk
warrants them. Implementation is not the same as release confidence.

## Known backend gaps (confirmed against D8N source, 2026-08-23)

- **No identifier-change endpoint.** There is no D8N API to correct/change an
  unverified email or phone after registration (searched the full
  `openapi.yaml` path list and the Rails controllers — only
  `POST/PATCH /api/v1/auth/verification` exist, and both operate on the
  identifier already on file). The frontend verification UI does not offer a
  "Change email"/"Change number" action because there is nowhere to send it.
  Needed: an endpoint to update the current user's unverified phone/email and
  re-dispatch a verification code to the new value.
- **Like/Pass/profile-detail do not check contact verification server-side.**
  `Api::V1::LikesController`, `Api::V1::ProfilePassesController`, and
  `Api::V1::ProfilesController#show` only call `authenticate_user!` (plus
  eligibility/rate-limit checks) — none check `IdentityIdentifier` verification
  state. The frontend gates these interactions in the UI, but an unverified
  user calling the API directly is not currently blocked by D8N.

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
