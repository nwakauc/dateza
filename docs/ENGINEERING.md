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

At this review the executable repository is a public landing page built with
React 18, TypeScript in strict mode, and Vite 5. The landing page is largely a
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

A written rule is weak if the repository cannot check it. Static analysis,
builds, tests, and focused browser verification are the quality gates. Any
known gap should be recorded honestly and closed before depending on it.

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
data-fetching library or router becomes necessary, record why the platform and
current stack are insufficient. Keep API errors machine-readable internally and
map them to safe, humane copy at the UI boundary.

The current `landingMarkup.ts` file is a temporary design port. It is acceptable
to repair its presentation narrowly, but feature work should migrate toward
semantic typed components. Raw HTML injection is prohibited for user/API data
because it creates an unnecessary XSS boundary and bypasses React's model.

## 5. UI quality standard

DateZA should feel distinctly South African through real content and restrained
brand details—not stereotypes or decorative gimmicks. Preserve the existing
editorial serif, warm neutral palette, and DateZA pink until a deliberate design
decision changes them.

For every screen verify:

- clear primary task and hierarchy;
- small-screen behavior without horizontal scrolling;
- keyboard order, visible focus, names, roles, and state announcements;
- text alternatives and non-color status cues;
- reduced-motion behavior and no disruptive motion;
- useful loading, empty, offline, expired-session, forbidden, and retry states;
- safe content around location, verification, reports, and account closure.

Avoid snapshotting large markup trees. Test what a person can perceive and do.

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

Use the smallest test that gives confidence:

| Change | Minimum evidence |
| --- | --- |
| Documentation/configuration | lint/typecheck where applicable; inspect diff |
| Pure function | unit tests for happy, boundary, and invalid inputs |
| Component behavior | browser-backed component test including accessibility |
| API-connected feature | contract fixtures plus failure and stale-state cases |
| Critical member journey | real-browser end-to-end test against a controlled environment |
| Bug fix | reproducing regression test, then fix and full relevant checks |

Tests must be deterministic and independent. Do not use production member data,
real secrets, precise locations, or message content in fixtures. Keep selectors
based on roles, labels, and stable user-visible behavior rather than CSS layout.

The repository currently has no automated test runner. Introduce one alongside
the first behavior needing automated coverage, make the choice explicit, and add
it to `npm run check`. Until then, `npm run check`, `npm run build`, and a focused
browser pass are required for UI changes.

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

- Routine UI/copy: implementation review plus lint, typecheck, build, browser.
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

Current approved skills:

| Skill | Use |
| --- | --- |
| `frontend-design` | Intentional production UI creation and redesign |
| `vercel-react-best-practices` | React structure and performance review |
| `web-design-guidelines` | Accessibility and interface-quality audit |
| `webapp-testing` | Local browser exploration and verification |

Install or update skills with telemetry disabled. Review their source, origin,
security assessment, lockfile change, and any scripts before use. Do not update
skills incidentally during application work.

Review this engineering guide when the application gains a router, API client,
test runner, state library, mobile workspace, deployment pipeline, or accepted
ADR. Replace stale statements instead of appending contradictory rules.
