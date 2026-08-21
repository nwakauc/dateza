# D8N and DateZA Holistic Product and Platform Plan

**Status:** Planning baseline  
**Date:** 2026-08-21  
**Products:** D8N platform, DateZA South Africa, future D8N brands  
**Clients:** Web application and mobile application  
**Backend:** D8N Core API

## 1. Purpose

This document defines how D8N becomes a reusable global dating technology
company and how DateZA becomes the first South African consumer experience on
that platform.

DateZA must be a genuinely good dating product before it becomes a collection
of advanced features. The core promise is:

> Real people. Better matches.

The product loop remains:

```text
Create account → build profile → discover people → like/pass → match → chat → meet
```

Trust, RealMe, compatibility, and AI should improve this loop. They must not
make the basic product confusing or slow.

## 2. Strategic architecture

```text
DateZA Web ─────┐
DateZA Mobile ───┼── D8N Core API ── D8N platform domains ── data/providers/jobs
Future brands ──┘
```

D8N owns reusable product capabilities, safety rules, tenant isolation, data
contracts, and platform intelligence. A brand owns its presentation, language,
positioning, catalogue choices, and product configuration.

DateZA must not create a second dating backend. It consumes D8N through a
brand-bound API origin. D8N resolves the brand from the request host; clients do
not send a user-controlled `brand_id`.

Every brand must have explicit configuration for:

- host/domain and CORS origins;
- authentication methods;
- profile fields, option groups, prompts, and completion requirements;
- discovery/matching strategy;
- media visibility policy;
- trust and verification policy;
- notification and entitlement policy.

## 3. Backend audit: what exists today

The audit used the current d8n routes, `docs/api/openapi.yaml`,
`docs/api/README.md`, request tests, model tests, ADRs, and the beta TODO files.
The OpenAPI contract is the current machine-readable route contract, but parts
of the prose documentation are behind the implementation.

### 3.1 Reuse immediately

| Capability | Current D8N state | DateZA use |
| --- | --- | --- |
| Brand-bound identity | Phone/email password registration and login, sessions, session revocation, password change, recovery, identifier verification | DateZA account and secure session lifecycle |
| `/me` bootstrap | Current identity, brand, and session response | Client startup and token validation |
| Dynamic profile contract | Profile configuration, required fields, option groups, prompts, and completion state | Render onboarding from DateZA configuration instead of hardcoded HookUs fields |
| Profile management | Profile, preferences, controlled options, prompts, location, publication | DateZA profile creation and editing |
| Private location | Precise coordinates accepted but not returned | Distance eligibility without exposing residential location |
| Profile photos | Direct upload intent, presigned upload, attach, signed retrieval, delete/purge | Profile media workflow, subject to DateZA media policy |
| Discovery | Eligible public profiles, opaque cursors, `for_you` and `new_here` modes, optional vibe/online facets | Baseline discovery feed and future DateZA strategy |
| Public profile detail | Stable public UUID and safe profile shape | Refreshable profile pages and deep links |
| Likes and passes | Idempotent profile actions | Core interaction loop |
| Matching | Mutual likes produce canonical matches | Match celebration and match list |
| Hooks | Stronger-intent opener with recipient reply flow | Optional post-MVP DateZA interaction |
| Blocking | Directional block with reciprocal safety enforcement | Mandatory safety UI |
| Reporting | Profile/content report routes with bounded reasons | Mandatory report flows; moderator handoff |
| Conversations | Match-gated conversation creation and participant scoping | Match-to-chat transition |
| Text messages | Current contract and tests include cursor-paginated text read/send endpoints | MVP chat, using polling rather than realtime |
| Account closure | Brand-level closure, session revocation, profile anonymisation, match ending, media purge | Settings and account deletion |
| Admin moderation baseline | Report queue, report detail/transition, brand-level suspension/reinstatement | Internal DateZA moderation operations |
| Contract discipline | OpenAPI route coverage test and stable error codes | Typed client generation and integration tests |

### 3.2 Reuse after DateZA configuration or a small backend adaptation

These are platform capabilities, but the current implementation is oriented
around HookUs and must be made brand-configurable before DateZA depends on them.

- **Profile catalogue:** DateZA needs South African cities/provinces,
  relationship intentions, languages, family goals, lifestyle fields, and
  optional faith/cultural fields. These must be declared as reusable profile
  capabilities and selected by the DateZA catalogue.
- **Completion rules:** DateZA onboarding requires a smaller, high-value set of
  fields than a generic profile. Requiredness and conditional requirements need
  an explicit DateZA configuration rather than frontend-only validation.
- **Matching strategy:** the existing strategy interface and eligibility rules
  are reusable, but DateZA needs an approved production strategy. The backend
  currently documents HookUs compatibility reasons such as `shared_intent`,
  `similar_vibe`, and `mutual_age_fit`; DateZA needs its own bounded reasons and
  weighting decisions.
- **Discovery modes:** `for_you` is a starting point for DateZA Discovery.
  DateZA's separate Find experience needs filter semantics, quotas, and likely a
  dedicated mode or endpoint. It must not be simulated by blindly reusing the
  curated feed.
- **Media policy:** the upload and safe-delivery foundation is reusable, but
  DateZA must select its photo visibility and moderation policy and prove the
  full object lifecycle in its deployment.
- **Trust presentation:** D8N has safety enforcement primitives, but no public
  trust-standing response. DateZA needs a safe, explainable presentation contract
  that never exposes raw fraud scores or moderation internals.
- **Moderation:** the current admin surface is a beta report queue and
  brand-level enforcement. DateZA needs moderator assignments, MFA, photo and
  verification review procedures, and operational runbooks.

### 3.3 Not available and requiring new D8N work

The following README promises do not have usable consumer APIs in the audited
backend:

| Product requirement | Required D8N work |
| --- | --- |
| RealMe email/phone/selfie/photo/video/ID verification | Verification domain, provider boundary, verification attempts, webhooks, assertions, badge policy, retention, and consumer endpoints |
| Public RealMe badge and explanation | Safe verification status/capability response with exact claim wording |
| Trust standing such as “Building Trust” or “Good Standing” | Trust signal model, privacy-safe aggregation, policy, serializer, and abuse-resistant update rules |
| DateZA compatibility score and “Why this match?” | DateZA matching strategy, explainable reason catalogue, score contract, preference taxonomy, and tests |
| 10 curated Discovery recommendations per day | Daily recommendation allocation, quota state, reset rules, exhaustion response, and idempotency |
| 10 Find profiles/swipes per day | Find endpoint or explicit discovery mode, filter contract, quota accounting, abuse limits, and entitlement hooks |
| Age, distance, gender, relationship-intention Find filters | Backend query parameters and strategy-safe validation; current discovery exposes only mode, vibe, online, cursor, and limit |
| Image sharing in chat | Messaging/media attachment contract, private delivery, moderation, reporting, retention, and size limits |
| Delivery/read state | Message delivery/read-state model and endpoints |
| Push and in-app notifications | Notification preferences, event model, device-token registration, push/email providers, and privacy controls |
| Subscriptions and DateZA+ | Billing, products, entitlements, purchase validation, restore, cancellation, and server-authoritative limits |
| Funnel and product analytics | Privacy-safe event contract, aggregation, retention, dashboards, and exclusion of message bodies/precise location |
| Full admin user/media/verification/risk operations | Search, profile review, media moderation, verification review, risk views, audit history, and MFA |
| Unmatch | Explicit match lifecycle endpoint and data policy; blocking currently ends access as a safety action |
| Conversational AI Matchmaker | Authorised query-to-filter service that cannot bypass eligibility, privacy, or safety rules |

## 4. Documentation reconciliation required

The current OpenAPI contract lists `GET` and `POST`
`/api/v1/conversations/:conversation_id/messages`, and message request tests
cover persistence, pagination, authorization, blocking, suspension, and Unicode.
However, the top of the OpenAPI description and `docs/api/README.md` still say
messaging is metadata-only. The backend team must reconcile this before client
SDK generation.

The same audit shows that trust, admin, account closure, and media code is ahead
of some older ADR/TODO prose. The implementation status should be published as
one current capability matrix with separate labels for:

- implemented and tested;
- implemented but awaiting staging proof;
- configured for HookUs only;
- planned/no endpoint.

## 5. D8N platform roadmap

### Layer A — Core identity and tenancy

Keep brand-bound sessions, host resolution, account closure, public UUIDs, and
neutral error behavior as platform invariants. Add a deliberate DateZA brand
provisioning path and automated tenant-isolation tests.

### Layer B — Reusable profile and media capabilities

Finish the capability catalogue so each brand composes fields, options,
prompts, labels, and completion rules. Keep precise location private. Finish
media processing, approved-variant delivery, moderation state enforcement, and
purge operations before scaling consumer photo usage.

### Layer C — Matching and discovery intelligence

Separate shared eligibility from brand-specific ranking. Build DateZA's
strategy with hard constraints first, then explainable compatibility signals.
Implement Discovery and Find as separate product contracts, including daily
allocation and filter/entitlement rules.

### Layer D — Trust and RealMe

Treat identity verification, behavioural trust, and compatibility as different
domains. Build RealMe assertions and trust standing without exposing sensitive
provider outcomes, fraud scores, or enforcement details. Every public badge must
state exactly what it means.

### Layer E — Safe communication

Keep match-gated text messaging and cursor polling as the first delivery model.
Add message throttling, message reporting evidence, read state, retention, and
erasure before attachments or realtime features. Add push notifications only
after a privacy-safe event contract exists.

### Layer F — Commercial and intelligence platform

Add subscriptions and entitlements after usage proves the limits worth paying
for. Add analytics around the funnel and recommendation quality. Build AI as an
authorised orchestration layer over structured D8N data, never as an independent
privacy or eligibility bypass.

## 6. Web and mobile strategy

### Shared product contract

Web and mobile should share:

- generated API types/client;
- authentication/session rules;
- domain models and machine-error mapping;
- onboarding state machine;
- discovery/matching rules;
- quota and entitlement display logic;
- analytics event names;
- accessibility and safety copy;
- visual tokens and content rules where practical.

They should not share one rendering implementation at the cost of good platform
experiences.

### Web application

The web app should provide:

- public brand and marketing pages;
- responsive authenticated dating experience;
- account and profile management;
- discovery, Find, likes, matches, and chat;
- safety/settings surfaces;
- an installable/PWA-friendly shell where useful.

The web client should use deep-linkable public profile routes and canonical API
fetches so refreshes and new tabs work without a discovery-cache dependency.

### Mobile application

The mobile app should provide the same core product contract with mobile-native
handling for:

- photo capture/upload and permissions;
- location permissions;
- push notifications;
- secure token storage;
- offline-safe optimistic UI with server reconciliation;
- app lifecycle and background refresh.

Mobile must not create alternate business rules. It should consume the same D8N
API and typed client as web.

### Recommended delivery order

Build the API client and domain contract first, then web and mobile in parallel
once the contract stabilises. The web app is the fastest end-to-end validation
surface; mobile follows the same completed vertical slices rather than waiting
for every future capability.

## 7. Delivery phases

### Phase 0 — Align the platform

- Provision DateZA as a D8N brand.
- Add DateZA local/staging hosts and CORS origins.
- Define DateZA profile catalogue and matching decisions.
- Reconcile OpenAPI status documentation.
- Decide which README promises are MVP launch gates versus later releases.

### Phase 1 — Prove the standard loop

Ship registration, onboarding, photos, publication, Discovery, Find baseline,
likes, matches, text chat, block/report, and account closure on web and mobile.
Run a two-user staging journey before public release.

### Phase 2 — Make DateZA meaningfully different

Ship DateZA compatibility explanations, DateZA discovery allocation, RealMe
minimum verification, safe trust standing, notification foundations, and
improved South African profile vocabulary.

### Phase 3 — Operate and monetise safely

Ship moderation tooling, push notifications, subscriptions/entitlements,
analytics, Find limits, and scam-warning interventions with operational proof.

### Phase 4 — Expand D8N

Extract reusable platform contracts, onboard additional brands, add AI
Matchmaker, and preserve strict tenant boundaries and brand-specific strategy
configuration.

## 8. Governance and success measures

Every backend API change must update OpenAPI, integration guidance, request tests,
and the client contract. Every brand feature must identify whether it belongs in
D8N Core or DateZA presentation/configuration.

Core product measures:

- registration-to-profile completion;
- profile publication rate;
- first-discovery engagement;
- likes per active user;
- mutual-match rate;
- conversation-start rate;
- first-reply rate;
- meaningful conversation rate;
- block/report rate and response time;
- retention;
- verification-to-engagement impact;
- recommendation-to-conversation impact.

The long-term D8N moat is the compounding quality of its identity, trust,
compatibility, and match-intelligence systems—not merely the number of screens
or brands.

