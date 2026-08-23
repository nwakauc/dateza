# DateZA Engineering Guide

**Status:** Adopted repository standard
**Last reviewed:** 2026-08-22
**Applies to:** DateZA web repository contributors and coding agents

The root `AGENTS.md` is the concise operational contract. This document records
the reasoning behind it and gives maintainers a stable place to evolve the
engineering system without turning every agent session into a policy essay.

Focused permanent context is split into `ARCHITECTURE.md`, `SECURITY.md`,
`TESTING.md`, and `CAPABILITIES.md`. Load only what the current responsibility
needs. Backend implementation rules, database invariants, and D8N ADRs belong in
the D8N repository; this frontend repository records and tests the client side
of approved contracts.

## 1. What this repository is

DateZA is the consumer experience; D8N Core is the platform. The boundary is
deliberate:

```text
DateZA web -> brand-bound D8N API -> platform domains and providers
```

At this review the executable repository is a public landing page at `/` plus
authentication screens, schema-driven onboarding with owner photo upload, a
protected home placeholder,
and a public 404, built with React 18, TypeScript in strict mode, Vite 5, and
React Router (`docs/decisions/0001-spa-routing.md`). The landing page is largely a
static HTML design port with responsive CSS and a small imperative mobile-menu
adapter. Product specifications describe the future authenticated application,
but plans are not evidence that a feature or API exists.

This distinction prevents two costly agent failures: implementing imagined
backend behavior in the client, and advertising planned trust capabilities as
already delivered.

## 2. Sources of truth

When documents disagree, use this order and report the conflict:

1. Executable D8N contract and verified environment behavior for API facts.
2. Accepted project decision records, once introduced.
3. `AGENTS.md` for repository working rules.
4. `docs/MVP_PLAN.md` for delivery scope and blockers.
5. `docs/README.md` for product intent.
6. `docs/HOLISTIC_PLAN.md` for long-term platform direction.
7. Existing code for current implementation—not necessarily desired design.

Do not silently resolve a material product, privacy, or contract conflict. Add
an ADR under `docs/decisions/` when a choice changes an enduring boundary,
dependency, data flow, security posture, or team-wide convention.

An ADR should contain status, context, decision, alternatives, consequences,
security/privacy effects, and reversal cost. Small local implementation choices
do not need ADRs.

## 3. Engineering principles

### Require readiness before velocity

A non-trivial ticket is not ready until priority, owner, objective, invariants,
non-goals, contract dependencies, abuse cases, acceptance criteria, and test
evidence are explicit. Use `docs/templates/ENGINEERING_TICKET.md`. Inspect and
plan in a read-only phase; implementation begins after plan approval.

### Build vertical slices

Prefer a thin, working journey through real contracts over many disconnected
screens. A slice owns its loading, empty, error, permission, safety, and
responsive states. Mock data may support isolated design work, but it must be
clearly separated and must not masquerade as a backend capability.

### Keep authority at the right boundary

The browser may validate for feedback, but D8N remains authoritative for
identity, permissions, profile publication, eligibility, ranking, quotas,
matching, trust, moderation, and entitlements. Server responses win over cached
optimism. Opaque cursors and identifiers remain opaque.

### Optimize for comprehension

Prefer explicit state, narrow modules, ordinary React, and names from the
product language. Extract repetition after a stable pattern appears. Avoid
frameworks, global state, service layers, and generic component systems until a
demonstrated need justifies their ownership cost.

### Make quality executable

A written rule is weak if the repository cannot check it. Strict TypeScript,
lint, production builds, and focused browser verification are always in play.
Automated tests are added when they protect meaningful regression risk—not as
ceremony. Known quality gaps should be recorded honestly.

### Own the member experience

A compiling screen that mirrors the API is not finished product work. DateZA
agents are expected to exercise product judgment: choose the right control,
write consumer copy, design for mobile first, collect only what onboarding
needs, and verify the journey as a member would use it. The founder is not the
frontend QA department. The operational contract is in `AGENTS.md`; the UI
standard below is the expanded source.

## 4. Frontend boundaries

As the authenticated application grows, prefer feature ownership:

```text
src/
  components/       shared presentation primitives with real reuse
  features/         auth, profile, discovery, matching, messaging, safety
  lib/api/          transport, generated contract types, error mapping
  pages/            route-level composition
```

This is a direction, not permission to scaffold empty architecture.

Keep remote state close to its feature until shared coordination is real. If a
data-fetching library becomes necessary, record why the platform and current
stack are insufficient. Client routing is recorded in
`docs/decisions/0001-spa-routing.md`. Keep API errors machine-readable internally
and map them to safe, humane copy at the UI boundary.

The current `landingMarkup.ts` file is a temporary design port. It is acceptable
to repair its presentation narrowly, but feature work should migrate toward
semantic typed components. Raw HTML injection is prohibited for user/API data
because it creates an unnecessary XSS boundary and bypasses React's model.

## 5. UI quality standard

DateZA frontend work is senior product-engineering and product-design work.
Backend contracts define validity; they do not automatically define the best
user interface. The job is to turn verified capabilities into an excellent
consumer dating-product experience, not to make API fields appear on screen.

### Product judgment

Actively evaluate UX on every frontend ticket. Do not wait for the founder to
identify obvious problems. Before declaring work complete, ask whether a
polished consumer app would ask the question this way; whether the control is
correct; whether the member must understand implementation details; whether
there is unnecessary friction; whether the question is needed now; whether
information is requested too early; whether sensible defaults exist; whether
the primary action and progress are obvious; whether mistakes are recoverable;
whether the flow works naturally on mobile; whether copy sounds like a dating
product; whether the interface feels intentional and premium; and whether
tests would still miss an obvious interaction failure.

Correct obvious poor UX when it is safe inside ticket scope. If a fix requires
a product or backend decision outside scope, flag it rather than silently
shipping poor UX. Preserve approved visual and product decisions, but do not
preserve poor implementation-quality UX merely because it already exists.
Propose substantial redesigns that sit outside scope; do not silently rewrite
the product.

Agents may improve control choice, labels, helper copy, spacing, hierarchy,
loading and disabled states, duplicate-submit prevention, mobile usability,
and consumer language without asking permission for every detail. Agents may
not silently change core product policy, business rules, backend authority,
pricing, safety policy, matching semantics, major navigation architecture, or
brand identity.

### Controls and consumer language

Choose controls from the human task, not the API datatype. A backend string is
not automatically a text box; a date is not a raw date string; an array is not
necessarily typed text plus Add; a country code should normally be a
human-readable country list; a constrained choice should use select, segmented
control, radio group, chips, autocomplete, or a picker depending on set size
and context; a boolean is not automatically a generic checkbox. The frontend
translates between human experience and the API contract.

Never expose implementation language to members—D8N, backend, API, schema,
payload, server enforcement, internal IDs, or database terminology—unless the
concept is genuinely part of the customer product. Do not ship copy such as
"D8N enforces the allowed range" or "DateZA does not invent extra dating
filters here." Translate constraints into natural product UX. Write for
someone looking for a date.

### Visual direction

DateZA should feel distinctly South African through real content and restrained
brand details—not stereotypes or decorative gimmicks. Preserve the existing
editorial serif, warm neutral palette, and DateZA pink until a deliberate design
decision changes them. The product should feel premium, youthful, warm,
confident, modern, trustworthy, romantic without becoming cheesy, distinctly
consumer-facing, and consistent with the approved landing-page direction.

Avoid generic SaaS forms, admin-dashboard aesthetics, developer-tool language,
giant forms, unnecessary explanatory text, excessive borders, dense
configuration screens, raw browser controls where a modest enhancement
materially improves usability, dark HookUs-style visual language, and
inconsistent one-off components. Do not over-design. Clarity and ease of use
come before decoration.

Every screen should make immediately understandable: where the member is; what
they are asked to do; why it matters, if explanation is necessary; what the
primary action is; and what happens next. Helper copy must not compete visually
with the task.

### Mobile-first, onboarding, and progressive disclosure

Dating products are primarily personal and mobile. Evaluate every new
application screen at mobile sizes first—thumb reach, tap targets, mobile
keyboards, select/picker behavior, sticky actions, scrolling, focus, density,
image interaction, validation placement, safe spacing, and keyboard-obscured
controls. Desktop must remain excellent; mobile is not a compressed desktop
layout.

Onboarding should collect the minimum information needed for a useful member
experience. Do not expose every backend preference because it exists.
Distinguish identity/profile information, essential matching intent, discovery
filters that can be tuned later, optional profile enrichment, and
verification/trust as separate journeys where appropriate. Avoid narrowing a
new member's pool before they have experienced DateZA. Use broad, sensible
server-supported defaults where product requirements permit. Prefer getting
the member successfully into DateZA, letting them experience value, then
letting them refine—not configuring the entire dating engine before they see
another person.

### Interaction quality and visual QA

Every interactive feature must consider loading, disabled/pending, success,
validation, failure, retry, duplicate clicks, empty, keyboard, focus, touch,
and asynchronous state changes. A `200` response is not proof that the UX
works. Verify the user-visible outcome.

For significant UI work, source inspection and tests alone are insufficient.
Use the approved frontend skills, then inspect the result. Representative
widths include 1440/1280 desktop, 768 tablet, 390 mobile, and 360 mobile; use
judgment rather than mechanically testing every width. Check hierarchy,
alignment, spacing, typography, control choice, readability, overflow, image
crops, focus, keyboard behavior, loading and error states, actual
navigation/progression, and console/network anomalies.

A frontend feature is not done merely because TypeScript compiles, an API
returns 200, tests pass, or the build succeeds. Done means, proportional to the
ticket: correct, usable, visually intentional, responsive, accessible,
integrated, and verified from the member's perspective.

For every screen also verify:

- clear primary task and hierarchy;
- small-screen behavior without horizontal scrolling;
- keyboard order, visible focus, names, roles, and state announcements;
- text alternatives and non-color status cues;
- reduced-motion behavior and no disruptive motion;
- useful loading, empty, offline, expired-session, forbidden, and retry states;
- safe content around location, verification, reports, and account closure.

How to verify those qualities is in `docs/TESTING.md`. Do not snapshot large
markup trees.

## 6. API, privacy, and security review

Before integrating an endpoint, establish:

- authentication and authorization requirements;
- request, response, error, pagination, and idempotency semantics;
- which fields are public, private, transient, or sensitive;
- retry and concurrency behavior;
- logging/analytics restrictions;
- block, suspension, closure, and revoked-access outcomes.

Tokens must not enter URLs, analytics, error-report payloads, or ordinary logs.
Do not use local storage for long-lived credentials without an explicit security
decision. Never expose exact coordinates or infer hidden eligibility and
moderation reasons from response differences.

Any UI that shows verification must describe the exact verified assertion.
Verified phone or email is not proof of government identity. A compatibility
score must come with bounded server-issued reasons and must never expose another
person's private preferences.

## 7. Testing strategy

`docs/TESTING.md` is the frontend testing policy. Do not duplicate it here.

Summary: lean and risk-based; unit tests are not the default; browser QA is
first-class; add automation when it protects a meaningful regression (auth,
session, safety, privacy, server reconciliation, important journeys). Do not
install a test runner solely for routing, a static 404, or simple presentation.

| Change | Minimum evidence |
| --- | --- |
| Documentation/configuration | lint/typecheck where applicable; inspect diff |
| Low-risk visual UI | `npm run check`, `npm run build` when appropriate, browser and accessibility QA |
| Isolated non-trivial logic | small unit tests when the logic has real edge cases |
| Meaningful interactive or high-risk UI | static checks, build, browser QA, plus focused automated tests |
| Critical member journey | real-browser verification; later a small E2E suite |
| Bug fix | failing regression test only when automation is the chosen evidence |

## 8. Dependencies and generated assets

Before adding a dependency, document the problem, available platform solution,
maintenance/security posture, bundle/runtime cost, and exit cost. Prefer a
small direct implementation when it is clearer and safer. Commit
`package-lock.json` with dependency changes and never mix an unexplained lockfile
rewrite into unrelated work.

Commit source code and intentional optimized web assets. Do not commit `dist`,
`node_modules`, local environment files, build-info artifacts, raw member data,
or unoptimized source photography. Generated API types may be committed only
when their generation command and source contract are documented and reviewable.

## 9. Review levels

Use review effort proportional to risk:

- Routine UI/copy: implementation review plus lint, typecheck, build, browser,
  and a product/UX pass (control choice, consumer copy, mobile, interaction).
- Authentication, profile publication, discovery, messaging, or payments:
  contract and negative-path review in addition to the above.
- Location, identity verification, trust, moderation, blocking/reporting,
  analytics, or account closure: explicit privacy/security review and evidence
  that D8N enforcement cannot be bypassed from another client.

Agents should stop when the required contract or policy is absent. A polished
guess is still a defect.

For high-risk changes, use an independent adversarial review after
implementation. Ask the reviewer to find specification violations,
authorization bypasses, privacy leaks, races, unsafe retries, missing database
or API guarantees, accessibility failures, and rollback hazards. Reviewers do
not broaden the ticket or redesign unrelated code.

## 10. Maintaining the agent system

Project skills are versioned in `skills-lock.json` and copied into
`.agents/skills` so their behavior can be reviewed with the codebase. They are
supporting workflows, not an alternate policy layer. Keep the set small.

For frontend tickets, inspect this set before implementation. When a skill is
relevant, use it. Do not ignore an applicable specialist skill and then produce
a generic implementation. Repository rules and verified product/backend
contracts still take precedence over generic skill guidance.

Current approved skills:

| Skill | Use |
| --- | --- |
| `frontend-design` | Intentional production UI creation and redesign; follow DateZA's approved landing-page direction rather than a generic aesthetic |
| `vercel-react-best-practices` | React structure and performance review |
| `web-design-guidelines` | Accessibility and interface-quality audit |
| `webapp-testing` | Local browser exploration, screenshots, and verification for meaningful UI work |

Install or update skills with telemetry disabled. Review their source, origin,
security assessment, lockfile change, and any scripts before use. Do not update
skills incidentally during application work.

Review this engineering guide when the application gains an API client,
state library, mobile workspace, deployment pipeline, or a new accepted ADR.
Replace stale statements instead of appending contradictory rules.
