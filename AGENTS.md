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

For UI, inspect the changed journey in a real browser at relevant widths;
check keyboard flow, reduced motion, console, and network. Do not claim a check
passed if it was not run, and do not weaken a gate to make work pass.

Pause before changing API assumptions, auth/session storage, brand resolution,
eligibility, authorization, age/consent, safety copy, retention, sensitive
analytics, or RealMe/trust claims. Also pause for destructive data work, major
dependencies, product/ADR conflicts, or unavailable D8N behavior.

## Project skills

Pinned skills live in `skills-lock.json` and `.agents/skills`:

- `frontend-design`: substantial UI design;
- `vercel-react-best-practices`: React implementation/performance;
- `web-design-guidelines`: accessibility/interface audit;
- `webapp-testing`: local browser verification.

Use them when their description matches, but treat them as process guidance,
not product authority. Review origin, scripts, security assessment, and diff
before installing/updating skills. Keep the approved set small.

## Done and handoff

Done means acceptance criteria and applicable negative/accessibility cases are
met, checks pass, the diff is scoped, and docs/contracts/cockpit are accurate.
Report:

- `IMPLEMENTED` and `FILES CHANGED`;
- `API / DATA CHANGES`;
- `AUTOMATED TESTS` (or `None — not warranted because …`);
- `BROWSER QA`, `VIEWPORTS`, `ACCESSIBILITY QA`;
- `STATIC VERIFICATION` (exact commands and results);
- `CONSOLE / NETWORK` and `REMAINING RISK`;
- `SECURITY / PRIVACY / ACCESSIBILITY`;
- `DEPLOYMENT / ROLLBACK`;
- `KNOWN LIMITATIONS`, `NOT IMPLEMENTED`, and `FOLLOW-UP`.

One coherent ticket should yield one reviewable commit, normally
`type(scope): imperative summary`. Agents do not commit unless asked, but keep
the diff commit-ready.
