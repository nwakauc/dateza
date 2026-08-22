# DateZA Testing Standard

**Status:** Adopted baseline  
**Last reviewed:** 2026-08-22

Testing proves invariants; it does not merely exercise lines. Write acceptance
evidence before implementation for every non-trivial ticket.

## Required case matrix

Select applicable rows and state why omitted rows do not apply:

- happy path and observable outcome;
- unauthenticated, wrong-owner, forbidden, suspended, blocked, and revoked cases;
- empty, loading, retryable error, permanent error, stale response, and session
  expiry states;
- minimum, maximum, malformed, Unicode, timezone, and responsive boundaries;
- replay, duplicate submission, rapid interaction, concurrency, and out-of-order
  response cases;
- persistence across reload/session where required;
- cross-feature effects, especially block/report/closure across discovery,
  matching, media, and messaging;
- privacy, accessibility, and abuse regression cases.

## Evidence by layer

- Type and lint gates: `npm run check`.
- Production compilation: `npm run build`.
- Pure functions: deterministic unit tests using public behavior.
- Components: browser-backed interaction tests queried by role/name, including
  focus and announcements. Avoid brittle implementation snapshots.
- D8N integration: versioned fixtures or a controlled test server; validate
  contract errors and server-authoritative reconciliation.
- Critical journeys: real browser at mobile, tablet, and desktop widths, with
  keyboard navigation, reduced motion, and console/network error inspection.

The repository has no automated test runner yet. The first behavior-bearing
feature must propose and install the minimum suitable runner, add a representative
test, and wire the deterministic test command into `npm run check`. Browser
exploration is evidence during development, but critical stable journeys should
become checked-in automated tests.

## Test quality rules

- A regression test must fail for the reported defect before the fix.
- Do not mock the exact implementation under test or assert private state.
- Never use production people, messages, credentials, photos, or exact
  locations as fixtures.
- Control time, randomness, network, and IDs. Tests must run independently and
  in any order.
- Failure output must help identify the broken invariant.
- Never weaken assertions, skip a gate, or regenerate snapshots solely to make
  a change pass.
- Report exact commands, pass/fail counts, skipped tests, and any untested risk.

