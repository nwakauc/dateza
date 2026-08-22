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
copy, and adaptation of approved D8N contracts. D8N owns identity,
authorization, profiles, media policy, eligibility, discovery/ranking, likes,
matches, messaging, trust, moderation, quotas, entitlements, and lifecycle
rules.

The recurring design question is:

> Is this DateZA presentation, or a D8N capability with DateZA policy?

If another brand could need the same invariant, data, enforcement, or lifecycle,
it almost certainly belongs in D8N. DateZA may choose configured policy; it must
not fork the engine.

## Repository state

The executable app is currently a React 18 + TypeScript + Vite public landing
page. `src/pages/landingMarkup.ts` is a static design port rendered through
`dangerouslySetInnerHTML`; `src/pages/LandingPage.tsx` adds imperative mobile
navigation. This is acknowledged legacy presentation debt, not the pattern for
the authenticated app.

There is currently no router, API client, remote-state library, test runner,
authenticated application shell, or D8N SDK in this repository. Do not infer
their existence from planning documents.

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

