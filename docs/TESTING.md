# DateZA Testing Standard

**Status:** Adopted baseline
**Last reviewed:** 2026-08-22
**Applies to:** DateZA frontend in this repository

Testing exists to create confidence. It is not a volume target. Effort must
scale with **risk × complexity × likelihood of regression**.

This document is the detailed source of truth for frontend testing policy.
`AGENTS.md` carries the short operational rule. D8N backend testing philosophy
is owned in the D8N repository and is not redefined here.

## Philosophy

DateZA uses **lean, risk-based testing plus strong browser QA**.

The default verification stack for ordinary frontend work is:

1. TypeScript / typecheck
2. lint / static checks
3. production build when the change can affect compilation or output
4. browser QA
5. accessibility and keyboard QA
6. focused automated tests only where they protect meaningful behavior
7. a small number of high-value end-to-end journeys as the product matures

Do not replace obvious browser inspection with large unit or component suites.
For significant UI/UX tickets, source inspection and automated tests alone are
insufficient: inspect the rendered journey and verify the user-visible outcome.
Do not test React, React Router, CSS engines, or the browser merely because
those layers are easy to assert. A test must protect a meaningful DateZA
behavior or regression.

Frontend **unit tests are optional, not mandatory by default**.

## Agent test-budget rule

Before adding an automated frontend test, ask:

> What realistic regression or important invariant does this test protect?

If there is no strong answer, do not write the test. Do not broaden a small
frontend ticket into a large testing exercise. Do not install a test library
because it is common in React projects. Infrastructure must stay proportional
to product maturity.

## When not to write unit or component tests

Do not require automated tests for:

- static React components, headings, copy, or text rendering
- simple buttons, wrappers, or layout components
- CSS classes, typography, colors, spacing, or images
- straightforward responsive layout
- simple prop forwarding
- behavior already verified at a more valuable layer (browser QA, E2E, or
  types)
- proving that `/` still mounts the landing page or that an unknown path shows
  a static 404, unless a later regression specifically needs that lock

Do not test implementation details. Do not snapshot large markup trees,
including `landingMarkup.ts`.

A primarily visual ticket may have **zero new automated tests** when static
checks, build, browser QA, and accessibility review give enough confidence.
The completion report must state why automation was unnecessary.

## When unit tests are appropriate

Use a small, targeted unit suite when there is meaningful isolated logic:

- non-trivial pure transformations
- complicated state reducers
- parsing or normalization
- deterministic calculations
- boundary-heavy utilities
- security-sensitive client transformations
- logic with several important edge cases

Even then, keep the set small. Do not add cases that only restate the happy
path already covered by types or a higher-level test.

## Automated interaction tests

Use component or integration tests **selectively** when they protect meaningful
interaction, for example:

- authentication and session state
- route guards (not the mere existence of a public 404)
- meaningful form behavior
- complicated multi-step interactions
- API error reconciliation
- permission-sensitive presentation
- stale or asynchronous state with real regression risk

Prefer a few high-value assertions over many shallow ones. Do not exhaustively
test every variation.

## High-risk behavior still needs strong evidence

Lean testing is not permission to skip high-risk work. Stronger automated
evidence is expected for:

- authentication and session handling
- authorization-sensitive presentation
- onboarding eligibility
- account closure
- block / report and other safety flows
- privacy-sensitive behavior
- RealMe or trust presentation once a verified contract exists
- subscription or payment behavior
- server-authoritative reconciliation
- messaging permissions
- significant regressions involving member data
- complex race or retry behavior where the frontend participates

For these areas, negative cases and boundaries often apply. Select from the
matrix below and state why omitted rows do not apply:

- happy path and observable outcome
- unauthenticated, wrong-owner, forbidden, suspended, blocked, and revoked
- empty, loading, retryable error, permanent error, stale response, and session
  expiry
- minimum, maximum, malformed, Unicode, timezone, and responsive boundaries
- replay, duplicate submission, rapid interaction, concurrency, and
  out-of-order responses
- persistence across reload or session where required
- cross-feature effects (especially block, report, and closure across
  discovery, matching, media, and messaging)
- privacy, accessibility, and abuse regressions

For low-risk visual work, most of those rows do not apply. Do not treat the
matrix as a checklist for every UI ticket.

## Browser QA is first-class evidence

For visual and interaction work, inspect the change in a real browser. Depending
on the ticket, verify:

- desktop, tablet, and mobile widths
- visual fidelity, responsive behavior, image cropping, overflow
- navigation, forms, loading / empty / error states
- focus, keyboard access, reduced motion
- console errors and failed or unexpected network requests

Record what was inspected. Browser QA does not replace D8N enforcement or
strict TypeScript.

## Verification hierarchy

### Low-risk visual change

Required: relevant static checks; production build when appropriate; browser
QA; responsive QA where layout changes; accessibility and focus inspection
where interactive or readable content changes.

Automated tests: **usually unnecessary**.

### Normal interactive frontend feature

Required: static checks; build; browser interaction QA; accessibility QA.

Automated tests: **a small number when meaningful behavior warrants
protection**.

### High-risk frontend feature

Required: static checks; build; browser QA; focused automated tests; important
negative and boundary cases; security and privacy review.

### Critical cross-feature journey

Use focused integration tests where useful, and eventual browser E2E coverage
for a few stable journeys. Do not duplicate the same behavior at every layer
unless the risk justifies it.

## End-to-end

Prefer a **small, reliable E2E suite** of critical member journeys over
hundreds of component tests. Likely future journeys, **only after they exist**:

- register → onboarding → discovery
- sign in → discovery
- like → match
- match → conversation / message
- block → interaction unavailable
- logout or session expiry → protected content unavailable
- account closure

Do not create these journeys before the product can perform them. Do not pursue
exhaustive E2E coverage. Do not use production people, messages, credentials,
photos, or exact locations as fixtures.

## No coverage targets

Do not introduce arbitrary coverage percentages. Prohibited goals include
“80% coverage”, “100% coverage”, “every component needs tests”, and “every
function requires a unit test”. Coverage tools may be diagnostic; they are not
the definition of quality.

## When to introduce a test runner

Introduce automated frontend testing infrastructure when the first feature
arrives whose **regression risk materially benefits from repeatable
automation**.

Do **not** install a runner solely to assert routing, a static 404, or simple
presentation. Until that justified moment, `npm run check`, `npm run build`,
browser QA, accessibility review, and documented manual verification are
acceptable evidence for low-risk frontend work.

If a runner is already present in the tree, that does not make shallow UI tests
mandatory. Use it for tests that earn their keep. Do not weaken lint,
typecheck, or build gates.

## Evidence by layer

- Type and lint: `npm run check` (lint and typecheck; currently also runs
  `vitest run` because a runner is already in this working tree—that does not
  require new tests on low-risk tickets).
- Production compilation: `npm run build`.
- Isolated logic: small deterministic unit tests of public behavior, when
  justified above.
- Meaningful interaction: role- and name-based tests; no private-state
  assertions.
- D8N-connected features: versioned fixtures or a controlled test server;
  contract errors and server-authoritative reconciliation. Do not invent
  endpoints.
- Critical journeys: real browser at relevant widths, then a small E2E suite
  when the journeys are stable. Representative widths for meaningful UI work
  include 1440/1280 desktop, 768 tablet, 390 mobile, and 360 mobile; use
  judgment rather than mechanically testing every width. A successful HTTP
  status is not evidence that Continue, publish, or navigation actually
  completed for the member.

## Quality rules for tests that do exist

- A regression test must fail for the reported defect before the fix, when
  automation is the chosen evidence.
- Do not mock the exact implementation under test or assert private state.
- Never use production member data, real secrets, precise locations, or message
  content as fixtures.
- Control time, randomness, network, and IDs. Tests must run independently and
  in any order.
- Failure output must identify the broken invariant.
- Never weaken assertions, skip a gate, or regenerate snapshots solely to make
  a change pass.

## Completion reporting

Frontend tickets must report:

### AUTOMATED TESTS

Tests added, or `None — not warranted for this ticket because …`

### PRODUCT / UX REVIEW

UX decisions made and why (control choice, copy, defaults, disclosure, mobile).
Required for UI-bearing tickets.

### BROWSER QA / VISUAL QA

Exact pages or journeys actually inspected (hierarchy, alignment, spacing,
typography, readability, overflow, image crops, loading and error states).

### RESPONSIVE QA / VIEWPORTS

Relevant widths or devices checked.

### INTERACTION QA

End-to-end user actions exercised (including that primary actions actually
progress). Required for UI-bearing tickets.

### ACCESSIBILITY QA

Keyboard, focus, labels, and reduced-motion checks performed (or why they did
not apply).

### UX ISSUES FOUND AND FIXED

Problems the agent identified itself during implementation.

### REMAINING UX CONCERNS

Anything that should not be silently accepted.

### STATIC VERIFICATION

Exact lint / typecheck / check / build commands and results.

### CONSOLE / NETWORK

Relevant errors or unexpected requests observed.

### REMAINING RISK

What meaningful behavior remains unverified.
