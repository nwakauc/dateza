# Engineering Ticket: Preserve `/` landing and introduce SPA routing with 404

**Priority:** P0  
**Owner:** DateZA frontend  
**Status:** Ready

## Problem and objective

The site always mounts the marketing landing page and has no URL space for the
dating app. After this ticket, `/` is still the approved landing experience,
unknown paths render a public 404, and a documented React Router decision exists
so later tickets can add real screens without rewriting the landing port.

## Context and evidence

- `src/App.tsx` returned only `LandingPage`.
- `docs/ARCHITECTURE.md` recorded that no router existed.
- Landing uses hashes (`#discover`, `#sign-in`, …) that must not become
  `/discover` or `/sign-in` in this ticket.
- `docs/TESTING.md`: a public `/` plus a static 404 do not require a test
  runner. Evidence is `npm run check`, `npm run build`, `git diff --check`,
  and browser QA (desktop and a narrow viewport, keyboard/focus, console).
- D8N OpenAPI is not in this repository; this ticket must not add an API client
  or session bootstrap.

## Invariants

- `/` visually and structurally remains the current landing (`landingMarkup.ts`
  unchanged).
- Hash links on `/` still use `href="#…"`; they must not be rewritten to app
  paths.
- No user or API data in `dangerouslySetInnerHTML`.
- No auth redirects or product routes.
- Strict TypeScript; `npm run check`, `npm run build`, and `git diff --check`
  stay green.
- Vite major upgrade is out of scope.

## Non-goals

- Sign-in, sign-up, onboarding, discovery, Find, matches, messages, RealMe,
  settings, safety product UI.
- API client, generated types, env/API URL module, token storage, D8N mocks.
- Authenticated chrome, toasts, design-system extraction, landing JSX migration.
- Retargeting Join/Sign In to `/sign-up` or `/sign-in`.
- Fixing missing landing section `id`s.
- Vite 8 / `npm audit fix --force`.

## Contract and data impact

None. No D8N calls. No new persistence. Staging and production hosts must serve
`index.html` for unknown paths (documented in the routing ADR).

## Security, privacy, and abuse cases

- 404 copy is generic; no enumeration of member IDs.
- Error boundary must not render stack traces or request bodies to end users.
- No new analytics or third-party SDKs.

## User and accessibility states

- Happy: `/` shows landing; landing keyboard/menu behavior unchanged.
- Unknown path: reachable 404 with a link back to `/`, heading, and visible
  focus on that link.
- Error boundary: safe recovery without dumping internals.
- Auth/session/offline/D8N error cases do not apply (no API).

## Acceptance criteria

- [ ] `react-router-dom` is the only new runtime dependency, justified in an ADR.
- [ ] `/` still renders the existing `LandingPage`.
- [ ] A catch-all route renders a public Not Found page with a link to `/`.
- [ ] `npm run check`, `npm run build`, and `git diff --check` pass.
- [ ] Browser QA: `/` and an unknown path (desktop and a narrow width);
  keyboard access to the 404 home link; no console errors from the change.
- [ ] Docs that claimed “no router” are updated.

Automated tests for `/` vs 404 are not required and must not be added solely
for this ticket.

## Test evidence required

- `npm run check`, `npm run build`, `git diff --check`
- Browser: `/` shows the existing landing; `/this-route-does-not-exist` shows
  Not Found with a link to `/`
- Desktop and a narrow viewport
- Keyboard/focus on the 404 home control
- Console inspection
- Automated tests: none warranted — framework routing and static presentation

## Deployment and rollback

SPA rewrite already required for Vite apps. Rollback: revert the change; landing
returns. No migration.

## Definition of Ready

- [x] Objective, priority, owner, invariants, and non-goals are approved.
- [x] Existing implementation and ADRs were inspected.
- [x] Contract ownership and dependencies are available (none required).
- [x] Acceptance and test evidence are specific.
- [x] Security/privacy review level is known (routine UI + routing).
