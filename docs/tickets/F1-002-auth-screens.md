# Engineering Ticket: Sign up, sign in, logout and password recovery

**Priority:** P0  
**Owner:** DateZA frontend  
**Status:** Done

## Problem and objective

F1-001 bootstraps a bearer session from `GET /api/v1/me` but DateZA had no
authentication screens. Users can now register, sign in, sign out, and recover
a password against the verified D8N contract, then land in the existing
`SessionProvider`.

## Context and evidence

Verified from `d8n/docs/api/openapi.yaml`, D8N ADRs 0007 and 0012, and
controller tests:

- `POST /api/v1/auth/password/register` and `/login` with `identifier` +
  `password` return `201` plus an opaque `token` (registration authenticates).
- Duplicate/malformed registration is generic `422 registration_unavailable`.
- Failed login, including suspended/closed membership, is generic
  `401 invalid_credentials`.
- Sessions last 30 days on the server; D8N stores a token digest, not a
  browser persistence strategy. No refresh token. Logout is
  `DELETE /api/v1/auth/session` (`204`).
- Recovery is a three-step signed-out flow with anti-enumeration `202` on
  request.

DateZA ADR-0002 remains accepted: memory-only bearer storage.

## Invariants

- Brand is host-resolved; no client `brand_id`.
- Token stays out of URLs, logs, `localStorage`, `sessionStorage`, cookies
  written by JavaScript, and IndexedDB.
- Recovery UI never reveals whether an account exists.
- Registration collects credentials only (no onboarding fields).

## Non-goals

Onboarding, profile, photos, discovery, Find, likes, matches, messages,
RealMe, trust, compatibility, subscriptions, social login, remember-me,
authenticated password change UI, identifier verification UI.

## Contract and data impact

DateZA-only. No D8N changes. Credential holder remains
`src/lib/api/tokenStore.ts`.

## Security, privacy, and abuse cases

- Generic copy for duplicate identifiers and invalid credentials.
- Recovery uses D8N’s neutral message.
- Reset authorization is React Router location state, not a query string.
- Login/register/recovery `401`s do not wipe an unrelated in-memory session.
- Logout always clears local credentials; server revoke is best-effort.

## Acceptance criteria

- [x] Supported auth screens and routes exist.
- [x] Successful sign-in and registration establish central session.
- [x] Logout clears credential and session.
- [x] Recovery implemented with anti-enumeration copy.
- [x] Landing auth CTAs point at `/sign-in` and `/sign-up`.
- [x] Focused auth tests plus `npm run check` / `build` / `git diff --check`.
