# DateZA MVP Build Plan

**Status:** Ready to execute  
**Date:** 2026-08-21  
**Target:** First usable DateZA web and mobile product powered by D8N

## 1. MVP definition

The MVP proves one promise:

> A genuine person in South Africa can create a profile, find an eligible
> person, match, start a safe conversation, and leave safely if needed.

The MVP is not the complete D8N vision. It is the smallest product that proves
the normal dating loop while establishing the foundations for RealMe, Trust,
Compatibility, and AI.

## 2. Scope decision: available now versus launch blockers

### Build immediately against current D8N

- register and log in with enabled phone/email password methods;
- session bootstrap and logout;
- resumable profile onboarding;
- DateZA-configured profile fields, preferences, options, and prompts;
- precise location write flow without public coordinates;
- profile-photo upload, processing state, signed retrieval, reorder, and delete;
- published profile;
- baseline Discovery using the D8N discovery contract;
- public profile detail;
- Like and Pass;
- mutual Match;
- match-gated text conversations using polling;
- block, report, blocked-user settings;
- password management and brand-level account closure;
- web-responsive client and mobile client consuming the same typed API.

### Must be built before claiming the full DateZA promise

- DateZA brand provisioning and production matching strategy;
- DateZA compatibility score and explainable reasons;
- minimum RealMe verification flow and badge contract;
- safe trust-standing presentation;
- the distinct Discovery/Find product rules and daily limits;
- notification foundations;
- sufficient moderation operations and admin MFA;
- staging proof of media, safety, closure, and the two-user journey.

The frontend must not display a RealMe badge, trust score, compatibility score,
or “10 selected matches” as if those capabilities exist when the backend has not
issued the corresponding contract.

## 3. MVP user journeys

### Journey A — New member

```text
Welcome → auth methods → register → /me → profile configuration
→ profile draft → preferences/options/prompts → photos/location
→ completion review → publish → Discovery
```

The client follows `onboarding.next_step` from authentication and profile
responses. It does not assume every brand has the same required fields.

### Journey B — Discovery and Find

> **Update, 2026-08-23:** this section was stale. D8N now ships
> `GET /api/v1/find` with `dateza_v1` compatibility and a durable daily
> 10-unique-profile allowance (`FindAllowance`: `limit`/`used`/`remaining`/
> `resets_at`), and the frontend's product-facing "Discovery" screen is built
> on this endpoint (`src/features/discovery/`). `GET /api/v1/discovery`
> (HookUs's `for_you`/`new_here` feed) is a *separate* endpoint that remains
> deliberately unconfigured for the `dateza` brand per
> `d8n/docs/api/openapi.yaml` — do not point DateZA UI at it. Re-verify against
> the live openapi contract before trusting the "not yet exposed" framing
> below; it described an earlier backend state.

For the first build, implement the UI distinction even if the backend rollout is
staged:

- **Discovery:** curated, ranked profiles supplied by the DateZA strategy.
- **Find:** user-controlled browsing with approved filters and server-enforced
  quota.

~~Current D8N only exposes a general discovery endpoint with `for_you`/`new_here`,
vibe, online, cursor, and limit parameters. It does not yet expose the full
DateZA Find contract or daily 10-profile accounting.~~ (No longer accurate —
see the update above.) Therefore the first frontend slice may use a clearly
labelled baseline Discovery screen while D8N builds the final two-mode
contract.

### Journey C — Like to chat

```text
Discovery/Find → profile detail → like/pass
→ mutual match response → match screen → start conversation
→ poll message history → send bounded text
```

The client treats likes, passes, blocks, and conversation creation as
idempotent. Message history is newest-first with an opaque cursor; the client
must not decode or manufacture cursors.

### Journey D — Safety

Every profile and conversation surface must expose:

- block;
- report with bounded reason choices;
- neutral unavailable states;
- no disclosure of private coordinates, internal IDs, storage keys, or hidden
  moderation reasons.

Account closure must clearly explain that DateZA membership is closed and that
the current D8N operation is brand-level closure unless platform policy later
changes.

## 4. MVP backend workstream

### M0 — Provision DateZA

**Owner:** D8N/backend  
**Blocker:** Yes

Deliverables:

- create `dateza` brand;
- map local DateZA host and staging/production domains;
- enable approved auth methods;
- install DateZA profile catalogue;
- define DateZA requirements for display name, birthdate, gender,
  interested-in, preferences, photos, relationship intention, and selected
  compatibility fields;
- add DateZA CORS origins;
- add seed/setup and tenant-isolation tests.

Acceptance: DateZA requests resolve to DateZA, a token is brand-bound, and a
DateZA token cannot access another brand context.

### M1 — DateZA profile and media contract

**Owner:** D8N/backend + frontend  
**Blocker:** Yes

Deliverables:

- approve DateZA profile field and option matrix;
- expose labels, descriptions, cardinality, and requiredness through
  `/profile/configuration`;
- configure profile photo policy and processing states;
- verify public safe derivatives and signed URLs in staging;
- document pending/hidden/visible/rejected UI states;
- prove deletion and purge behavior.

Acceptance: a user can complete a DateZA profile without frontend hardcoded
taxonomy and can safely publish it with an approved photo.

### M2 — DateZA matching and compatibility

**Owner:** D8N/backend/product  
**Blocker:** Yes for the differentiated launch

Deliverables:

- define DateZA hard eligibility rules;
- define preference semantics and dealbreakers;
- implement the DateZA production discovery strategy;
- define a bounded compatibility score contract;
- define bounded explanation codes and DateZA copy;
- add deterministic ranking, cursor, tenant, and safety tests;
- decide whether `for_you` maps to Discovery and create a separate Find
  contract.

Acceptance: every compatibility explanation is derived from structured data,
is safe to display, and is consistent between web and mobile.

### M3 — Discovery and Find quotas

**Owner:** D8N/backend  
**Blocker:** Yes for the README-defined MVP

Deliverables:

- daily Discovery recommendation allocation, maximum 10 by default;
- daily Find profile/swipe allowance, maximum 10 for free users;
- quota status and reset response;
- idempotent accounting for retries and concurrent requests;
- age, location/distance, gender, and relationship-intention filters;
- subscription/entitlement integration seam, even before billing exists;
- neutral responses for exhausted quotas.

Acceptance: limits cannot be bypassed by changing clients, replaying cursors,
or using web and mobile together.

### M4 — Messaging safety completion

**Owner:** D8N/backend  
**Blocker:** Required before uncontrolled beta

Current text messaging exists in the executable contract, but the backend TODO
still identifies follow-up safety work. Complete:

- send throttling and abuse limits;
- message report evidence handoff;
- retention/export/erasure policy;
- optional per-participant read state;
- documentation reconciliation between OpenAPI, API guide, and ADR;
- staging proof of polling, block enforcement, suspension, and closure.

Image sharing, realtime, reactions, typing, and voice/video remain outside MVP.

### M5 — RealMe minimum slice

**Owner:** D8N/backend + product/security  
**Blocker:** Required before marketing RealMe

Start with the smallest defensible assertion:

- verified phone/email status using existing identifier verification;
- a separate RealMe status response that distinguishes identifier verification
  from identity verification;
- no claim that phone/email verification proves government identity;
- provider and retention decisions for selfie/ID verification before adding those
  levels;
- audit and privacy rules for verification attempts and assertions.

The first release may show “Phone verified” or “Email verified.” It must not
show “RealMe Verified” until the required RealMe threshold and exact badge
meaning are implemented.

### M6 — Trust and moderation minimum

**Owner:** D8N/backend/operations  
**Blocker:** Required before public launch

Deliverables:

- keep block/report flows free and prominent;
- add admin MFA;
- prove report review and brand-level suspension;
- define the support/appeal path;
- define a privacy-safe trust-standing contract or defer the public standing
  labels;
- record operational audit events without message bodies or sensitive data.

Do not expose raw trust or fraud scores in the client.

### M7 — Notifications

**Owner:** D8N/backend  
**Blocker:** Can follow the first closed beta, but needed for retention

Deliverables:

- in-app event/feed contract;
- device-token registration for mobile;
- push notification events for matches/messages/security;
- email preferences and delivery status;
- notification privacy and rate limits.

Until this exists, the web and mobile clients use refresh/polling and explicit
empty states; they do not invent notification state locally.

### M8 — Analytics

**Owner:** D8N/backend/product  
**Blocker:** Needed for a measurable beta

Deliverables:

- versioned event names for the dating funnel;
- client event adapter shared by web and mobile;
- server-side events for match/message/report outcomes;
- no message bodies, precise coordinates, tokens, or unnecessary PII;
- dashboards for onboarding, discovery, matches, conversations, safety, and
  retention.

## 5. Frontend workstream

### F0 — Repository and client foundation

- choose web and mobile frameworks and record the decision;
- create shared TypeScript domain types from the D8N OpenAPI contract;
- create a shared API client with base URL, bearer auth, timeout, retry, and
  machine-error handling;
- implement secure token storage appropriate to each platform;
- add API mocks based on the contract for frontend development;
- add environment files for local, staging, and production DateZA origins;
- add accessibility, responsive layout, and analytics conventions.

### F1 — Authentication

Screens/components:

- welcome and brand introduction;
- register;
- login;
- password recovery;
- verification;
- session expired and account unavailable states.

Call `/auth/methods` first and only display methods returned for DateZA.

### F2 — Onboarding and profile

Build a schema-driven form renderer for:

- profile fields;
- preferences;
- option groups;
- prompts;
- location;
- photo upload and ordering.

Build a completion navigator that maps backend `next_step` values to screens.

### F3 — Discovery, Find, and profile detail

- Discovery home with cards and empty states;
- baseline For You feed;
- Find shell behind the backend capability flag;
- filter UI only for filters supported by the returned DateZA contract;
- profile detail deep links;
- Like, Pass, Why this match, and unavailable handling;
- cursor pagination and refresh reconciliation.

### F4 — Likes, matches, and messages

- match celebration;
- matches list;
- conversations list;
- conversation detail;
- newest-first message pagination;
- bounded text composer;
- polling interval with visibility/lifecycle handling;
- no optimistic message success unless the server confirms persistence.

### F5 — Safety and account settings

- block confirmation;
- report reason sheet/form;
- blocked profiles;
- password change;
- verification status when available;
- account closure confirmation and result;
- privacy and safety education.

### F6 — Mobile-specific integration

- camera/photo-library permissions;
- direct upload progress and retry;
- secure credential storage;
- push permission and token registration once backend support exists;
- app resume refresh;
- deep links to profiles, matches, and conversations.

## 6. MVP releases

### Release 0 — API and brand readiness

No public UI commitment. Complete M0, contract generation, DateZA configuration,
and local/staging smoke tests.

### Release 1 — Closed internal alpha

Ship web first with registration, onboarding, profile, photos, baseline
Discovery, Like/Pass, Match, text chat, block, report, and closure. Use seeded
two-user testing and backend mocks where external providers are unavailable.

### Release 2 — Mobile alpha

Ship the same loop in mobile using the same API client and test users. Validate
photo permissions, app lifecycle, auth persistence, polling, and deep links.

### Release 3 — Differentiated DateZA beta

Only after M2/M3/M5/M6 are complete: release DateZA compatibility explanations,
RealMe minimum badge/status, trust-safe presentation, Discovery/Find limits, and
moderation operations to a controlled South African cohort.

## 7. MVP acceptance checklist

### Backend

- [ ] DateZA brand and domains provisioned
- [ ] DateZA profile catalogue and completion rules configured
- [ ] DateZA auth methods returned correctly
- [ ] DateZA matching strategy approved and tested
- [ ] Discovery/Find contract and quota rules implemented
- [ ] compatibility score/reasons implemented or explicitly deferred
- [ ] safe media lifecycle staging-proven
- [ ] messaging safety follow-ups decided and tested
- [ ] RealMe minimum contract implemented before using RealMe branding
- [ ] admin MFA and moderation drill complete
- [ ] account closure and purge drill complete
- [ ] API guide/OpenAPI status reconciled

### Web and mobile

- [ ] registration/login/logout/recovery
- [ ] resumable onboarding
- [ ] profile and preferences
- [ ] photo upload/order/delete
- [ ] publication and completion states
- [ ] Discovery
- [ ] Find, only if its backend contract is live
- [ ] profile detail and deep links
- [ ] Like/Pass
- [ ] Match
- [ ] text messaging with cursor pagination
- [ ] block/report
- [ ] settings and closure
- [ ] auth, safety, accessibility, and error-state tests
- [ ] two-user end-to-end journey on staging

## 8. Explicitly outside this MVP

- selfie, video, or government-ID verification unless M5 is completed;
- raw trust/fraud scores;
- image sharing in messages;
- realtime sockets, typing indicators, reactions, read receipts;
- subscriptions and paid quotas until billing exists;
- conversational AI Matchmaker;
- voice/video calls;
- stories, feeds, livestreams, gifts, coins, or gamification;
- cross-brand consumer data exposure;
- a separate DateZA backend.

## 9. First implementation sequence

```text
1. Provision DateZA brand and API environment
2. Generate the shared typed API client
3. Build auth and session bootstrap
4. Build schema-driven onboarding/profile
5. Integrate photos and publication
6. Build baseline Discovery and profile detail
7. Add Like/Pass and Match
8. Add polling text chat
9. Add block/report/settings/closure
10. Build mobile against the same completed slices
11. Implement DateZA matching, compatibility, RealMe, trust, and quotas
12. Run staging two-user and safety acceptance
```

The first coding task should be M0 plus F0. Once DateZA resolves correctly from
the D8N host and the typed client is generated from the canonical contract, the
team can build the standard dating loop immediately without waiting for every
future D8N domain.

