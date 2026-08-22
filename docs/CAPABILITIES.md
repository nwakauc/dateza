# DateZA Frontend Capability Cockpit

**Last verified against this repository:** 2026-08-22

This table records evidence, not aspiration. Update it only when a ticket adds
or invalidates the linked implementation and verification. Backend availability
must be confirmed from D8N; a planning document is not production evidence.

| Capability | Priority | Frontend state | D8N dependency | Automated evidence | Release confidence |
| --- | --- | --- | --- | --- | --- |
| Public responsive landing page | P1 | Implemented | None | lint, typecheck, build | Review in browsers |
| Registration and sessions | P0 | Not started | Brand auth contract/config | None | Not releasable |
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
requires linked automated evidence and controlled-environment proof appropriate
to the risk. Release confidence is assessed separately; code existing is not
proof that operations, abuse handling, monitoring, and rollback are ready.

## Known engineering debt

- The current Vite 5 dependency chain is affected by one high and one moderate
  development-tool advisory. npm proposes Vite 8, a breaking major upgrade.
  Handle this as a focused upgrade ticket with browser/build verification; do
  not use `npm audit fix --force` inside unrelated work.
- Automated behavior tests do not yet exist. The first behavior-bearing feature
  must introduce the minimum test runner and add it to `npm run check`.
- The landing page raw-markup/imperative navigation adapter is presentation debt
  and must not become the authenticated application architecture.
