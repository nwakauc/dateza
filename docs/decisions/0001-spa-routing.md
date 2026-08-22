# ADR-0001: SPA routing with React Router and BrowserRouter

**Status:** Accepted  
**Date:** 2026-08-22  
**Owners:** DateZA frontend  
**Supersedes:** None

## Context

DateZA is a Vite + React 18 client. Until this decision, `App` always rendered
the marketing landing page. Authenticated product URLs cannot exist without a
client router, and unknown paths must not silently show the landing page.

Marketing sections on `/` already use hash anchors (`#discover`, `#safety`,
`#sign-in`, and others). Those hashes are in-page bookmarks, not application
routes.

## Decision

Use `react-router-dom` with `BrowserRouter` (HTML5 history).

Registered routes for this decision’s first slice:

- `/` — existing `LandingPage`
- `*` — public Not Found page

Do not register unused product paths. Do not use `HashRouter`.

Staging and production must serve `index.html` for unknown paths so a direct
visit to `/this-route-does-not-exist` reaches the client router.

## Alternatives considered

- **No router / host 404 HTML:** cannot grow shareable in-app URLs.
- **HashRouter (`#/discover`):** collides with marketing hashes on `/` and
  produces uglier public URLs.
- **Next.js or another meta-framework:** out of scope; this repo is already Vite.
- **Hand-rolled `popstate` mapping:** more code, worse accessibility and
  maintenance than React Router.

## Consequences

- Direct imports from `react-router-dom` (`BrowserRouter`, `Routes`, `Route`,
  `Link`).
- Marketing `href="#discover"` stays on `/`; `/discover` remains unregistered
  until a later ticket owns that screen (and will 404 until then).
- Hosting owners must enable SPA fallback; missing fallback looks like a
  server 404 instead of the in-app page.
- `/` vs a static 404 may be verified with check, build, and browser QA; a
  test runner is not required for that slice (`docs/TESTING.md`).

## Security and privacy

Unknown paths show generic copy. URLs must not later be used to place
credentials, messages, or precise location in the path or query.

## Reversal and migration

Remove `react-router-dom` and restore `App` to render `LandingPage` only. Cost
is one revert-sized PR if no product routes exist yet. If product routes exist,
they must be re-homed or dropped first.
