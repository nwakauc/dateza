# DateZA Frontend Capability Cockpit

**Last verified against this repository:** 2026-08-22

This table records evidence, not aspiration. Update it only when a ticket adds
or invalidates the linked implementation and verification. Backend availability
must be confirmed from D8N; a planning document is not production evidence.

| Capability | Priority | Frontend state | D8N dependency | Verification evidence | Release confidence |
| --- | --- | --- | --- | --- | --- |
| Public responsive landing page | P1 | Implemented | None | lint, typecheck, build | Review in browsers |
| SPA routing and public 404 | P0 | Implemented | None | lint, typecheck, build | Review in browsers |
| Session bootstrap | P0 | Implemented | `GET /api/v1/me` bearer session | `src/features/session/session.test.tsx` | Needs staging host |
| Registration and sessions | P0 | Implemented | Brand-bound password register/login, `DELETE /api/v1/auth/session`, recovery | `src/features/auth/auth.test.tsx` | Needs staging host; reload signs out (memory-only token) |
| Profile/onboarding | P0 | Not started | DateZA profile configuration | None | Not releasable |
| Safe profile media | P0 | Not started | Upload, processing, moderation, revocation | None | Not releasable |
| Discovery/profile detail | P1 | Not started | DateZA eligibility/ranking contract | None | Not releasable |
| Like/pass/match | P1 | Not started | Idempotent interaction contract | None | Not releasable |
| Blocking/reporting | P0 | Not started | Cross-domain safety enforcement | None | Not releasable |
| Match-gated text chat | P1 | Not started | Messaging, rate limits, block enforcement | None | Not releasable |
| Account closure | P0 | Not started | Closure, revocation, purge contract | None | Not releasable |
| RealMe presentation | P1 | Not started | Exact verification assertion contract | None | Claim prohibited |
| Trust standing | P1 | Not started | Privacy-safe standing contract | None | Claim prohibited |
| Compatibility explanations | P1 | Not started | Score/reason contract | None | Claim prohibited |
| Frontend dependency health | P1 | Upgrade required | None | `npm audit` reports 1 high, 1 moderate | Vite major upgrade review required |

States are `Not started`, `In progress`, `Implemented`, and `Verified`. “Verified”
needs evidence that matches the risk: static checks, build, browser and
accessibility QA, plus automated tests when `docs/TESTING.md` says the risk
warrants them. Implementation is not the same as release confidence.

## Known engineering debt

- The current Vite 5 dependency chain is affected by one high and one moderate
  development-tool advisory. npm proposes Vite 8, a breaking major upgrade.
  Handle this as a focused upgrade ticket with browser/build verification; do
  not use `npm audit fix --force` inside unrelated work.
- The landing page raw-markup/imperative navigation adapter is presentation debt
  and must not become the authenticated application architecture.
- Bearer tokens remain process-memory only (ADR-0002). A browser reload signs
  the member out until D8N defines a safe persistence mechanism for clients.
