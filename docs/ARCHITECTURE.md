# DateZA Frontend Architecture

**Status:** Current baseline
**Last verified:** 2026-08-22

## System boundary

```text
Browser / DateZA client
        |
        | brand-bound, versioned HTTPS API
        v
D8N Core API
        |
        v
D8N domains, data stores, jobs, and providers
```

DateZA owns presentation, navigation, local interaction state, safe display
copy, and adaptation of approved D8N contracts. Contracts define what is valid;
they do not automatically define the best member interface. The client
translates between human experience and the API: control choice, consumer copy,
mobile-first layout, progressive disclosure, and visual hierarchy are DateZA
product work. D8N owns identity,
authorization, profiles, media policy, eligibility, discovery/ranking, likes,
matches, messaging, trust, moderation, quotas, entitlements, and lifecycle
rules.

The recurring design question is:

> Is this DateZA presentation, or a D8N capability with DateZA policy?

If another brand could need the same invariant, data, enforcement, or lifecycle,
it almost certainly belongs in D8N. DateZA may choose configured policy; it must
not fork the engine.

## Repository state

The executable app is a React 18 + TypeScript + Vite public site. `/` still
renders the approved landing page (`src/pages/landingMarkup.ts` via
`dangerouslySetInnerHTML`, plus the imperative mobile-menu adapter in
`LandingPage.tsx`). That port is acknowledged legacy presentation debt, not
the pattern for the authenticated app.

Client routing uses React Router with `BrowserRouter` (see
`docs/decisions/0001-spa-routing.md`). Public product paths are `/`, `/sign-up`,
`/sign-in`, `/forgot-password`, and `/reset-password`. Authenticated paths are
`/onboarding` (incomplete D8N profile setup, including owner photo upload) and `/home` (published or
suspended placeholder until Discovery exists). `/signed-in` still loads the
home placeholder for old links. Session bootstrap uses `GET /api/v1/me` with
D8N's HttpOnly browser-session cookie and CSRF contract (see
`docs/decisions/0003-same-origin-browser-session.md`).

Browser code always calls same-origin `/api/*`. Local development uses
`VITE_D8N_API_URL` only as Vite's server-side proxy target; Vercel rewrites the
same paths to `https://dateza-staging-api.d8n.tech` before its SPA fallback.
The browser never calls the D8N host directly. This keeps the session cookie
first-party while preserving D8N's upstream host-based DateZA resolution.
`https://staging-api.d8n.tech` is HookUs, not DateZA. Do not proxy to
`http://dateza.test:3000` unless a local D8N process is intended. Direct visits
to `/sign-up` and other client routes need the SPA rewrite in `vercel.json`.
Onboarding progress is server-owned (`GET /api/v1/profile` and
`GET /api/v1/profile/configuration`). There is still no remote-state library, authenticated application chrome, or
generated D8N SDK.

## Dependency direction

As real features arrive, dependencies should point inward:

```text
pages -> features -> shared components
                 -> API boundary -> generated/approved D8N contract
```

- Route/page modules compose journeys; they do not own server business rules.
- Feature modules own feature UI, local state, and contract adaptation.
- Shared components contain demonstrated cross-feature presentation reuse.
- The API boundary owns transport, authentication integration, machine-error
  mapping, and generated types. Leaf components do not invent endpoints.
- Domain calculations that must agree across clients belong in D8N unless the
  server explicitly publishes the inputs and client computation contract.

Do not create empty folders or speculative layers. Add a boundary when a real
vertical slice needs it and record enduring choices as ADRs.

## Contract evolution

Frontend and backend work use separate tickets joined by a versioned contract.
For each API change establish:

1. current and proposed request/response/error shapes;
2. backward-compatibility window and rollout order;
3. authorization, idempotency, pagination, and rate-limit semantics;
4. client fallback for old/new server versions;
5. contract or consumer tests on both sides;
6. rollback behavior.

The client never decodes opaque cursors, manufactures trust/compatibility
reasons, or treats optimistic state as server truth.

## Architectural decisions

Create `docs/decisions/NNNN-short-title.md` from the ADR template for choices
that agents must not casually reopen. Accepted ADRs can be superseded only by a
new ADR that explains the change; never edit history to make the old decision
appear different.

