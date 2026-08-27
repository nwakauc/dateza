# DateZA Frontend Capability Cockpit

**Last verified against this repository:** 2026-08-26

This table records evidence, not aspiration. Update it only when a ticket adds
or invalidates the linked implementation and verification. Backend availability
must be confirmed from D8N; a planning document is not production evidence.

D8N dependency columns below were re-verified directly against
`d8n/docs/api/openapi.yaml` ("Implementation status" preamble) and the live
Rails controllers/domain code (`d8n/app/controllers/api/v1/`,
`d8n/domains/profiles/`) on 2026-08-23, not against older DateZA planning
docs — several of those (`MVP_PLAN.md`, `HOLISTIC_PLAN.md`) had drifted stale
and described Discovery/Find/verification as unbuilt when D8N had already
shipped them. See "Known documentation drift" below.

| Capability | Priority | Frontend state | D8N dependency | Verification evidence | Release confidence |
| --- | --- | --- | --- | --- | --- |
| Public responsive landing page | P1 | Implemented: landing plus working public nav destinations (how it works, dating safely, stories, lifestyle, privacy, help, careers, cities, get the app) | None | `src/app/AppRoutes.test.tsx` | Review in browsers |
| SPA routing and public 404 | P0 | Implemented | None | lint, typecheck, build | Review in browsers |
| Session bootstrap | P0 | Implemented through same-origin `/api/*` gateway | `GET /api/v1/me` HttpOnly browser session + CSRF | `src/features/session/session.test.tsx`, `src/lib/api/client.test.ts` | Needs deployed iOS Safari + Chromium proof |
| Registration and sessions | P0 | Implemented through same-origin `/api/*` gateway | Brand-bound browser-session register/login, `DELETE /api/v1/auth/session`, recovery | `src/features/auth/auth.test.tsx`, ADR-0003 | Needs deployed register → `/me` → onboarding → refresh proof |
| Private identity (first/last name) | P0 | Implemented | `configuration.identity_fields`, `PATCH /api/v1/profile` `first_name`/`last_name` (owner-only, never public) | `src/features/onboarding/onboarding.test.tsx` | Needs staging host |
| Post-onboarding Edit profile | P1 | Implemented: photography-first `/profile/edit` with sectional nav, live public preview, `profile_completion` strength, capability-specific saves. Dating location uses D8N Places (`GET /places`, `PUT /profile/place`); device GPS write remains on onboarding until T10 | `GET/PATCH /api/v1/profile`, options, preferences, prompts `PUT`, photos upload/attach/delete, `GET /places`, `PUT /profile/place`, `PUT /profile/location` (GPS) | `src/features/profile/EditProfilePage.test.tsx`, `src/features/profile/edit/DatingPlacePicker.test.tsx` | Needs staging host; photo reorder/primary and language proficiency are backend gaps; full location read-back waits on T6 `GET /profile/location` |
| My profile / How you appear | P1 | Implemented: owner preview reuses `RichProfileView` + public visibility; no self-compatibility/distance; strength + edit chrome around the profile | `GET /api/v1/profiles/{id}` with `ownerPublicPreview`/`forOwnerPreview` fallback; `profile_completion` | `src/features/profile/ProfilePage.test.tsx`, `ownerPublicPreview.test.ts` | Needs signed-in staging QA; values/activity/self-compatibility are not rendered |
| Safe profile media | P0 | Implemented | Direct-to-R2 upload intent, attach, signed retrieval, delete | `src/features/onboarding/onboarding.test.tsx` photo step | Needs staging R2; DateZA `initial_visibility: immediate` (do not claim photos stay hidden until moderated); collection `maximum_count` is on configuration |
| Post-signup contact verification (email/phone OTP) | P0 | Implemented after onboarding with the shared OTP modal; lifecycle errors and resend timing are server-driven | `GET /api/v1/me`, `POST/PATCH /api/v1/auth/verification` (contact-only — not RealMe identity verification) | Focused Vitest coverage and local browser QA at 1440/768/390/360 | Needs staging delivery QA |
| Discover | P1 | Curated grid, client-side filters of the daily batch, match rail, complete-profile prompt for DateZA richness (not onboarding publication 100%); no Find fallback | `GET /api/v1/discovery`; `GET /profile` owner fields + photos; `profile_completion` when it reports gaps | `src/features/discovery/DiscoveryPage.test.tsx`, `src/features/profile/richProfileGaps.test.ts` | Needs staging host; server-side Discover modes still missing |
| Find | P1 | Premium three-column Find: swipe deck, Like/Pass, match → conversation, context rail, D8N opener (catalogue send / wait / incoming reply). Staging `GET /profile/configuration` currently returns `openers: []` even though `match.opener` is enabled and Find reports `opener_state: available` — send 422s `invalid_opener` until DateZA catalog is reinstalled | `GET /api/v1/find`; likes/pass; matches/conversation; notifications; `POST /api/v1/profiles/{id}/opener`; `GET /api/v1/openers`; reply/decline | `src/features/find/FindPage.test.tsx`, `src/lib/api/opener.test.ts` | Blocked on staging catalog seed (`Profiles::DatezaProfileCatalog.install!`); frontend will not invent opener lines; liking can make opener unavailable |
| Profile detail | P1 | Implemented, verification-gated in the UI and API | `GET /api/v1/profiles/{profile_id}` through `InteractionController` | Manual QA | Needs staging host |
| Like/Pass | P1 | Implemented, verification-gated in the UI and API | `POST /api/v1/profiles/{profile_id}/likes`, `POST /api/v1/profiles/{profile_id}/pass` through `InteractionController` | Manual QA | Needs staging host |
| Likes hub | P1 | Implemented: photography-first `/likes` as the match/inbound-interest center. All is the default combined relationship view; Mutual uses `GET /api/v1/matches` (cursor pagination, conversation reuse, profile origin), while Liked-you / You-liked remain honest capability boundaries because D8N has no incoming/outgoing lists. Match rail + MatchModal conversation start. Profile-completion tips. No popularity, visitors, boost, or premium. | `GET /api/v1/matches`; `POST /api/v1/matches/{id}/conversation`; `GET /api/v1/conversations`; like on profile detail; `profile_completion` | `src/features/likes/LikesPage.test.tsx`, `ProfileDetailPage.test.tsx` | Needs staging two-member proof; incoming/outgoing like lists and aggregate counts are backend gaps |
| Match | P1 | Match list, match celebration (modal + Likes/Discover/Find rail), start-chat action | `GET /api/v1/matches`, mutual-match like response, `POST /api/v1/matches/{id}/conversation` | Browser QA with controlled contract fixtures | Needs staging two-member proof |
| Blocking/reporting | P0 | Implemented for profile-scoped safety: shared report/block actions on profiles, Find, openers and chats; Safety Centre lists blocked members and supports authoritative unblock | `GET /api/v1/blocks`; `POST /api/v1/profiles/{id}/report`; `POST/DELETE /api/v1/profiles/{id}/block`; reciprocal cross-domain enforcement | `src/lib/api/safety.test.ts`, `src/features/profile/SafetyPage.test.tsx`, profile and chat integration tests | Needs staging two-member proof; message-level report UI, unmatch, and conversation mute remain gaps |
| Match-gated text chat | P1 | Premium responsive conversation list, history, cursor pagination, selection, profile context, safety actions, and bounded text send implemented | Conversation/message APIs; server rate limits and block enforcement; no authoritative unread/read receipts, typing, media, reactions, or realtime | `src/features/chats/ChatsPage.test.tsx`; browser QA with controlled populated fixtures | Needs staging two-member proof and visual QA |
| Product notifications | P1 | Inbox, unread count, individual read, and mark-all-read implemented | `GET/PATCH/POST /api/v1/notifications*`; current type set is limited to `dateza.welcome` | Browser QA with controlled unread fixture | Needs staging host |
| Account closure | P0 | Implemented in Settings with deliberate typed confirmation and post-success sign-out | `DELETE /api/v1/me` brand-level closure, session revocation, match ending and asynchronous media purge | `src/features/profile/SettingsPage.test.tsx` | Needs staging closure and purge drill; irreversible |
| RealMe presentation | P1 | Not started | Exact verification assertion contract (distinct from the contact-verification shipped above) | None | Claim prohibited |
| Trust standing | P1 | Not started | Privacy-safe standing contract | None | Claim prohibited |
| Compatibility explanations | P1 | Partial (Find surfaces `dateza_v1` score/confidence/reason codes; no "Why this match?" UI yet) | `dateza_v1` compatibility on `GET /api/v1/find` | Manual QA | Score/confidence shown; reasons not yet rendered |
| Frontend dependency health | P1 | Upgrade required | None | `npm audit` reports 1 high, 1 moderate | Vite major upgrade review required |

States are `Not started`, `In progress`, `Implemented`, and `Verified`. “Verified”
needs evidence that matches the risk: static checks, build, browser and
accessibility QA, plus automated tests when `docs/TESTING.md` says the risk
warrants them. Implementation is not the same as release confidence.

## Previously recorded backend gaps resolved

Re-verification against D8N source on 2026-08-24 found that login-email change
now has request/confirmation endpoints, and profile detail, Like, Pass, Matches,
Conversations, and Messages inherit `Api::V1::InteractionController`, which
enforces contact verification. Older cockpit notes claiming otherwise were
removed rather than carried forward as release blockers.

## Known documentation drift (fixed 2026-08-23)

`docs/MVP_PLAN.md` Journey B previously said D8N "does not yet expose the full
DateZA Find contract or daily 10-profile accounting." That contract
(`GET /api/v1/find`, `FindAllowance` with `limit`/`used`/`remaining`/
`resets_at`, `dateza_v1` compatibility) is implemented now. Treat DateZA
planning docs as a snapshot of intent at time of writing, not live backend
status — re-verify against `d8n/docs/api/openapi.yaml` and, where necessary,
the D8N source before trusting a "not implemented" claim in a dated plan.

## Known engineering debt

- The current Vite 5 dependency chain is affected by one high and one moderate
  development-tool advisory. npm proposes Vite 8, a breaking major upgrade.
  Handle this as a focused upgrade ticket with browser/build verification; do
  not use `npm audit fix --force` inside unrelated work.
- The landing page raw-markup/imperative navigation adapter is presentation debt
  and must not become the authenticated application architecture.
- Deployed browser-session reliability depends on the upstream cookie remaining
  host-only and D8N accepting the browser-facing Origin/CSRF contract. Validate
  registration and refresh on iOS Safari and Chromium before release (ADR-0003).
