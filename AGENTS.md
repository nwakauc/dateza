# DateZA Agent Guide

This is the operational source of truth for humans and agents in this
repository. Read it before editing.

## Scope and sources of truth

DateZA is a South African dating client of the separate D8N Core API. This
repository currently contains a React 18, strict TypeScript, and Vite public
site—not the dating backend, auth, matching, trust, moderation, or billing.

Read in this order:

1. This file, then relevant source, tests, configuration, and current diff.
2. `docs/README.md` for product intent and `docs/MVP_PLAN.md` for delivery scope.
3. Focused context as needed: `docs/ARCHITECTURE.md`, `docs/SECURITY.md`,
   `docs/TESTING.md`, and the evidence-based `docs/CAPABILITIES.md` cockpit.
4. `docs/HOLISTIC_PLAN.md` only for long-term platform context.

`docs/ENGINEERING.md` explains this standard. `ENGINEERING-0S.MD` is a generic,
unadopted template and is not project authority. A verified D8N contract is the
source of truth for API facts. Report material conflicts; do not guess.

## Product and safety invariants

- Keep the core loop obvious: create account, profile, discover, like/pass,
  match, chat, meet.
- D8N owns server business rules, identity, authorization, eligibility, quotas,
  matching, trust, moderation, entitlements, and lifecycle. DateZA owns client
  presentation and configured policy; do not create browser-authoritative
  substitutes or a second backend.
- Resolve brand through the configured API origin/host. Never accept or invent
  a user-controlled `brand_id`.
- Treat server configuration and machine-readable contracts as truth. Do not
  duplicate profile catalogues, permissions, limits, or reasons as client rules.
- Do not show RealMe, trust, compatibility, or allocation claims unless D8N
  explicitly supports the exact displayed claim. Plans are not capabilities.
- Never expose precise location, private IDs, storage keys, raw risk scores,
  moderation reasons, credentials, or messages in URLs, logs, or analytics.
- Block/report must remain prominent, free, neutral in wording, accessible, and
  server-enforced. Do not weaken age, consent, privacy, or abuse controls for UX.

Ask on every feature: who can act, who owns the resource, what block/suspension/
closure changes, whether IDs leak state, whether requests can replay/race/spam,
what is logged, and how access is revoked. Read `docs/SECURITY.md` for sensitive
work.

## Senior product and UX standard

Frontend work is senior product-engineering and product-design work, not
mechanical translation of API fields into React controls. Behave as a senior
frontend engineer and product-minded UI/UX engineer. The job is to turn verified
product capabilities and backend contracts into an excellent consumer dating
experience. Contracts define what is valid; they do not automatically define the
best interface.

Do not wait for the founder to find obvious UX problems. Before calling a
frontend feature done, judge the experience: is this how a polished consumer app
would ask this question; is the control right; is the member being asked to
understand implementation details; is there unnecessary friction; is this
question needed now; are we asking too early; are sensible defaults possible;
is the primary action obvious; is progress clear; can the member recover; does
it work naturally on mobile; does the copy sound like a dating product; does
the interface feel intentional and premium; would passing tests still miss an
obvious interaction failure.

If something is obviously poor UX and can be corrected safely inside ticket
scope, correct it. If the fix needs a product or backend decision outside
scope, flag it clearly; do not silently ship poor UX. Preserve approved visual
and product decisions, but do not keep poor implementation-quality UX merely
because it already exists. Propose substantial redesigns outside scope rather
than silently rewriting the product.

Choose controls from the human task, not the API datatype. A string is not
automatically a text box; a date is not a raw date string; an array is not
necessarily "type text and Add"; a country code should be a human-readable
country; a constrained choice should use select, segmented control, radio,
chips, autocomplete, or a picker as the set size and context warrant; a boolean
is not automatically a generic checkbox. DateZA translates between human
experience and the API contract.

Never expose implementation language to members (D8N, backend, API, schema,
payload, server enforcement, internal IDs, database terms) unless the concept
is genuinely part of the customer product. Translate constraints into natural
product UX. Do not explain engineering architecture in the UI. Write for
someone looking for a date.

DateZA should feel premium, youthful, warm, confident, modern, trustworthy,
romantic without becoming cheesy, distinctly consumer-facing, appropriate to
South Africa, and visually consistent with the approved landing-page direction.
Avoid generic SaaS forms, admin-dashboard aesthetics, developer-tool language,
giant forms, unnecessary explanatory text, excessive borders, dense
configuration screens, raw browser controls where a modest enhancement
materially improves usability, dark HookUs-style visual language, and
inconsistent one-off components. Do not over-design: clarity and ease of use
come before decoration. Every screen should make immediately clear where the
member is, what they are asked to do, why it matters if explanation is needed,
what the primary action is, and what happens next. Helper copy must not compete
with the task.

Dating products are primarily personal and mobile. Evaluate every new
application screen at mobile sizes first (thumb reach, tap targets, keyboards,
pickers, sticky actions, scrolling, focus, density, images, validation
placement, safe spacing, keyboard obscuring controls). Desktop must remain
excellent; mobile is not a compressed desktop layout.

Onboarding collects the minimum needed for a useful member experience. Do not
expose every backend preference because it exists. Distinguish identity/profile,
essential matching intent, later discovery filters, optional enrichment, and
separate verification/trust journeys. Avoid narrowing a new member's pool
before they have experienced DateZA. Use broad, server-supported defaults where
product requirements permit. Prefer get the member successfully into DateZA,
let them experience value, then let them refine—not configure the entire dating
engine before seeing another person.

Every interactive feature must consider loading, disabled/pending, success,
validation, failure, retry, duplicate clicks, empty state, keyboard, focus,
touch, and asynchronous changes. A `200` is not proof the UX works. Verify the
user-visible outcome (if the member presses Continue, they actually continue).

Agents may make small, obvious UX improvements inside ticket scope without
asking permission for every detail (control choice, labels, hierarchy, loading
and disabled states, duplicate-submit prevention, usable mobile controls,
consumer copy). Agents may not silently change core product policy, business
rules, backend authority, pricing, safety policy, matching semantics, major
navigation architecture, or brand identity.

Do not make the founder the frontend QA department. Identify obvious UI, UX,
responsiveness, accessibility, interaction, and product-quality problems before
presenting work as complete. The bar is senior production-quality consumer
frontend work, not technically functional scaffolding. Detail:
`docs/ENGINEERING.md`.

## Architecture and code

- Prefer small typed React components and semantic JSX. New interaction uses
  React state, refs, and handlers—not document-wide queries or manual listeners.
- `landingMarkup.ts` and `dangerouslySetInnerHTML` are legacy presentation debt.
  Keep maintenance narrow; never interpolate user/API data into raw HTML and do
  not use this pattern for new application features.
- Organize real growth by feature (`src/features/auth`, `profile`, `discovery`,
  etc.). Shared UI belongs in `src/components`; transport/generated types belong
  at `src/lib/api`. Do not scaffold speculative layers.
- Components coordinate UI; pure typed code or D8N owns domain decisions. Keep
  network access out of leaf presentation components.
- Model async states explicitly: loading, success, empty, error, pending, and
  unavailable. Unknown server state is not success.
- Keep TypeScript strict; narrow `unknown`. Avoid `any`, unsafe assertions,
  duplicated contract types, clever abstractions, and premature global state.
- Use existing React/platform capabilities before dependencies. New packages
  require concrete need, maintenance/security/bundle review, and lockfile change.
- Preserve DateZA's visual language unless redesign is the ticket. All UI needs
  keyboard access, visible focus, labels, meaningful alternatives, contrast,
  usable targets, reduced motion, and responsive behavior.

## Delivery protocol

One conversation/ticket owns one engineering responsibility. Frontend work does
not casually modify D8N, infrastructure, or product policy. Split cross-repo
work into coordinated owner-specific tickets joined by an explicit contract.

For non-trivial work, phase one is read-only inspection and a proposed plan.
Implementation begins after approval. A ticket is Ready only when priority,
owner, objective, invariants, non-goals, contract, security/abuse cases,
acceptance criteria, and evidence are clear. Use
`docs/templates/ENGINEERING_TICKET.md`.

1. Inspect existing implementation, nearby tests, configuration, accepted ADRs,
   product/API constraints, and the current diff. Search for duplicate concepts.
2. Propose the smallest plan satisfying the acceptance criteria; include rollout
   and rollback where risky.
3. After approval, implement the smallest coherent vertical slice. Do not mix
   unrelated refactors or generated churn into the ticket.
4. Add automated tests only when they protect a meaningful DateZA invariant.
   Do not generate unit or component tests for trivial presentation. High-risk
   bug fixes that warrant automation begin with a failing regression test.
5. Run required checks, inspect the final diff, report failures honestly, and
   update only documentation made stale by the change.

Prioritize P0 safety/launch foundations before P1 MVP, P2 improvements, or P3
experiments. Finished beats exciting. Do not overwrite unrelated user changes,
edit generated output/build-info by hand, or commit secrets/raw source photos.

Create an ADR from `docs/templates/ADR.md` for enduring boundaries,
dependencies, data flows, or security posture. Never reverse an Accepted ADR
implicitly; propose a superseding ADR or stop and report the conflict.

## Verification

Frontend testing is lean and risk-based. Confidence over test volume. Effort
scales with risk × complexity × likelihood of regression. Unit tests are not
the default. Before writing an automated test, name the realistic regression it
protects; if you cannot, skip it. Browser QA is first-class evidence. High-risk
member, safety, session, and privacy behavior still needs strong automated
evidence. Details: `docs/TESTING.md`.

Use npm (`package-lock.json`):

```sh
npm ci
npm run check
npm run build
git diff --check
```

For meaningful UI work, source inspection and tests alone are insufficient.
Use the relevant design, accessibility, React, and browser-QA skills, then
actually inspect the result. Verify applicable screens at representative widths
such as 1440/1280 desktop, 768 tablet, 390 mobile, and 360 mobile; do not
mechanically test every width when unnecessary. Check hierarchy, alignment,
spacing, typography, control choice, readability, overflow, image crops, focus,
keyboard behavior, loading and error states, actual navigation/progression, and
console/network anomalies. Do not claim a check passed if it was not run, and
do not weaken a gate to make work pass.

Pause before changing API assumptions, auth/session storage, brand resolution,
eligibility, authorization, age/consent, safety copy, retention, sensitive
analytics, or RealMe/trust claims. Also pause for destructive data work, major
dependencies, product/ADR conflicts, or unavailable D8N behavior.

## Project skills

Pinned skills live in `skills-lock.json` and `.agents/skills`. For frontend
tickets, inspect this set before implementation. When a skill is relevant, read
and follow it; do not ignore an applicable specialist skill and then produce a
generic implementation. Repository rules and verified product/backend contracts
still take precedence over generic skill guidance.

- `frontend-design`: substantial UI design and visual identity (use for new
  screens and redesign; keep DateZA's approved landing-page direction);
- `vercel-react-best-practices`: React structure and performance;
- `web-design-guidelines`: accessibility and interface-quality audit;
- `webapp-testing`: local browser exploration, screenshots, and verification.

Treat skills as process guidance, not product authority. Review origin, scripts,
security assessment, and diff before installing/updating skills. Keep the
approved set small.

## Done and handoff

A frontend feature is not done merely because TypeScript compiles, an API
returns 200, tests pass, or the build succeeds. Done means, proportional to the
ticket: correct, usable, visually intentional, responsive, accessible,
integrated, and verified from the member's perspective—plus acceptance
criteria, applicable negative cases, a scoped diff, and accurate
docs/contracts/cockpit. Report:

- `IMPLEMENTED` and `FILES CHANGED`;
- `API / DATA CHANGES`;
- `AUTOMATED TESTS` (or `None — not warranted because …`);
- `PRODUCT / UX REVIEW` (decisions made and why);
- `BROWSER QA` / `VISUAL QA` (what was actually inspected);
- `RESPONSIVE QA` / `VIEWPORTS` (relevant widths or devices);
- `INTERACTION QA` (end-to-end user actions exercised);
- `ACCESSIBILITY QA`;
- `UX ISSUES FOUND AND FIXED` (problems the agent identified itself);
- `REMAINING UX CONCERNS` (nothing silently accepted);
- `STATIC VERIFICATION` (exact commands and results);
- `CONSOLE / NETWORK` and `REMAINING RISK`;
- `SECURITY / PRIVACY / ACCESSIBILITY`;
- `DEPLOYMENT / ROLLBACK`;
- `KNOWN LIMITATIONS`, `NOT IMPLEMENTED`, and `FOLLOW-UP`.

One coherent ticket should yield one reviewable commit, normally
`type(scope): imperative summary`. Agents do not commit unless asked, but keep
the diff commit-ready.
