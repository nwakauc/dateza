# ADR-0003: Same-origin gateway for browser sessions

**Status:** Accepted  
**Date:** 2026-08-26  
**Owners:** DateZA frontend  
**Supersedes:** ADR-0002

## Context

D8N now supports browser sessions established by an HttpOnly cookie plus a
CSRF token returned by authenticated identity bootstrap. DateZA was calling the
DateZA D8N host directly from its Vercel host. Those hosts are different browser
sites, so Safari can reject or omit the session cookie even when CORS permits
the request. Registration then succeeds, but the immediate `GET /api/v1/me`
returns `401` and the member is sent to sign-in instead of onboarding.

Browser-specific exceptions cannot make cross-site cookies reliable across
Safari, Firefox privacy modes, Chrome policy changes, and embedded browsers.

## Decision

- Browser code calls only same-origin `/api/*` paths.
- Local development proxies `/api/*` through Vite to the configured DateZA D8N
  upstream.
- Vercel rewrites `/api/*` to the DateZA D8N upstream before applying the SPA
  fallback.
- `VITE_D8N_API_URL` configures only the local development proxy. It is not
  embedded as a browser-facing API origin.
- D8N remains the single backend and owns authentication, authorization, brand
  resolution, session expiry, revocation, and CSRF validation.
- The upstream DateZA host remains the brand-resolution input; the browser does
  not send or choose a `brand_id`.
- Browser-session cookies used through the gateway must be host-only (no
  upstream `Domain` attribute), `HttpOnly`, `Secure`, and scoped to `Path=/`.
  D8N owns the final SameSite policy.
- Credentialed unsafe requests continue to send D8N's CSRF token.

## Alternatives considered

- Keep direct cross-site browser calls: rejected because browser privacy policy
  can prevent the session from surviving registration.
- Persist bearer tokens in browser-readable storage: rejected because it
  increases credential exposure and conflicts with the preferred HttpOnly
  browser-session boundary.
- Keep bearer tokens only in memory: rejected for the web application because
  refresh destroys the session and D8N now has an explicit browser-session
  contract.
- Add a second DateZA backend: rejected. The hosting rewrite is a transport
  gateway to the existing D8N backend, not a new business-logic service.

## Consequences

Registration, identity bootstrap, onboarding, and refresh use a first-party
browser session on supported browsers. The frontend no longer needs a
deployment-time API-origin variable.

The Vercel rewrite currently names the DateZA staging upstream. Production
promotion must deliberately change that destination and redeploy. Preview
deployments share the same staging upstream unless their hosting configuration
is split later.

Successful frontend checks cannot prove an upstream cookie is host-only or that
D8N accepts the browser-facing Origin. Deployment verification must inspect the
registration response, the following `/me` request, onboarding navigation, and
session survival after refresh on iOS Safari and a Chromium browser.

## Security and privacy

The cookie remains unreadable to JavaScript. The gateway must forward
`Set-Cookie` without adding an upstream `Domain`, must not log credentials or
CSRF values, and must not redirect API requests to the upstream public host.
D8N must validate CSRF and authorization on every protected action; same-origin
routing is not authorization.

The rewrite preserves D8N's DateZA-specific upstream host for brand resolution.
No member-controlled brand selector or trusted client header is introduced.

## Reversal and migration

Reversal requires a new accepted ADR and a verified replacement session
contract. A bearer migration would need token lifetime, refresh, revocation,
storage, XSS exposure, and native-client behavior reviewed before browser code
changed.
