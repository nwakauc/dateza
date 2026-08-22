# ADR-0002: In-memory D8N bearer session on the DateZA client

**Status:** Accepted  
**Date:** 2026-08-22  
**Owners:** DateZA frontend  
**Supersedes:** None

## Context

D8N’s verified OpenAPI contract authenticates consumer APIs with an opaque
HTTP Bearer token (`components.securitySchemes.bearerAuth`). It does not
document cookie sessions or CSRF for `GET /api/v1/me`. DateZA
`docs/SECURITY.md` forbids casual long-lived token storage in the browser.

## Decision

- Bootstrap identity with `GET /api/v1/me`.
- Send `Authorization: Bearer <token>` when a token is present in **process
  memory only**.
- Use `credentials: "omit"` (no cookies).
- Do not persist the token in `localStorage`, `sessionStorage`, URLs, or
  logs.
- Treat HTTP `401` with machine error `unauthorized` as unauthenticated
  (missing, expired, revoked, or wrong-brand token — D8N does not distinguish
  these on `/me`).
- Do not treat network or non-401 failures as authenticated or as a silent
  logout.

Cold start without a memory token calls `/me` without Authorization and
receives `401`, which is unauthenticated. Login persistence is a later ticket
and needs its own security review if a browser-readable store is required.

## Alternatives considered

- HTTP-only cookie session: not what D8N’s contract specifies.
- `localStorage` bearer: convenient but long-lived and XSS-readable; rejected
  until an explicit security ADR says otherwise.

## Consequences

F1-002 keeps this decision: D8N still issues opaque Bearer tokens with no
cookie, refresh-token, or approved browser store. Reload therefore signs the
user out. Durable persistence remains a D8N/client architecture follow-up.

## Security and privacy

Tokens stay out of URLs, logs, and analytics. `user_id` from `/me` is a
private platform id and must not be used as a public profile id or put in
paths.

## Reversal and migration

Replace the in-memory holder if D8N adopts cookies or an approved store.
Existing SessionProvider can keep calling `GET /api/v1/me`.
