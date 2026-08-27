# DateZA Frontend Production Audit

**Date:** 26 August 2026
**Commit audited:** `bfa0b85` — *feat(profile): enhance EditProfilePage and mobile menu functionality*
**Environment:** local Vite dev server (`localhost:5173`) against the **staging** D8N API
**Account used:** live signed-in staging member, profile `3262`, display name `Naledi (QA)`, verified contact, 93% profile completeness, **0 matches, 0 conversations, 0 incoming likes**
**Type:** read-only audit. No product code was modified. Working tree is clean.

---

## Scope honesty statement

Read this first, because it constrains every score below.

**Exercised live in the browser this session:** landing, 404, Discover (desktop + mobile), the
Discover location gate, Discover filter sheet, Find (desktop), Likes (desktop + mobile), Chats
(desktop + mobile), Notifications (desktop), My Profile (desktop), Edit Profile (desktop),
Settings (desktop + mobile), Safety centre (desktop), the new mobile menu drawer, plus direct
URL loads (refresh resilience) of every authenticated route.

**NOT exercised live this session — assessed from source, tests and prior evidence only:**

| Area | Why not | Consequence |
| --- | --- | --- |
| Sign-up, sign-in, password recovery | Browser held an active session; `GuestRoute` redirects away | Auth scores are **source-derived, not verified** |
| Onboarding all steps | Account already onboarded; no fresh registration performed | Onboarding score is **source-derived** |
| Individual conversation, composer, send | Account has **zero matches**, so no conversation exists | Messaging verified only by endpoints + tests |
| Rich profile `/profile/:id` of another member | No match/like target reachable | Not visually verified |
| Photo upload / photo manager | Would mutate the staging account | Not verified |
| Verification modal | Contact already verified | Not verified |
| 834 × 1112 and 1920 × 1080 widths | Time; capture surface constraints | **Tablet and large-desktop are untested** |
| Multi-photo / rich / sparse peer profiles | Only staging seed data available | Edge-profile audit is partial |

Anything above is reported as `NOT TESTED`, never as passing. The brief's instruction not to
claim an unrun check is honoured literally.

A second constraint: the browser capture surface is fixed at ~845 × 368 CSS px. Desktop
screenshots at 1440 × 900 were produced by temporarily scaling the document with an injected
CSS transform, then removing it. They are therefore **legible but low-resolution** — fine for
layout, hierarchy and dead-space judgements, unreliable for fine typography. Two findings I
initially drafted from screenshots (a "Vava/Vavo" name mismatch on Find, a clipped
"Unavailable" label on Safety) were **disproved** by DOM measurement and are not reported.
Every visual claim below was confirmed numerically or in source.

---

# A. EXECUTIVE SUMMARY

## Overall frontend production readiness: **58 / 100**

That number is deliberately uncomfortable. The engineering is genuinely good; the **product is
not yet a dating product**. DateZA today is a well-built, honest, largely empty shell. A real
customer signing in tomorrow would not hit crashes — they would hit *nothing to do*, and they
would find that three of the four primary navigation destinations have little or no content.

The distribution matters more than the average:

- **Craft / code quality: ~80/100.** Zero console errors, zero 4xx/5xx across the whole
  journey, clean refresh resilience on every route, real server-backed safety primitives,
  honest "Unavailable" labelling instead of fake features, 242/244 tests passing.
- **Product completeness: ~40/100.** Likes has one working tab out of four. Discover's entire
  filter panel cannot widen the candidate pool. Notifications has one event type and four dead
  filter tabs. Settings has three sidebar sections that mostly say "Unavailable".
- **Launch legality: blocked.** No published Terms, no POPIA-grade Privacy Policy, no
  Community Guidelines.

## Top strengths

1. **Honesty as a design principle.** The app repeatedly refuses to fake data. `LikesPage`
   has a test literally named *"loads GET /api/v1/matches and never invents an incoming-likes
   endpoint"*. Empty states explain the real limitation rather than showing mock people. This
   is rare and valuable — it means the roadmap below is trustworthy.
2. **Safety primitives are real, not theatre.** `block`, `unblock`, `report` (with a documented
   reason enum) and `GET /api/v1/blocks` are all server-backed in `src/lib/api/safety.ts`.
   The Safety centre's *entry point* is broken (P0-3), but the capability underneath is genuine.
3. **Zero runtime noise.** Across the full journey: **0 console errors**, **0 failed requests**,
   **0 4xx/5xx**. Only two React Router v6→v7 future-flag warnings.
4. **Refresh resilience is solid.** Every authenticated route (`/discover`, `/find`, `/likes`,
   `/chats`, `/notifications`, `/profile`, `/profile/edit`, `/settings`, `/settings/safety`)
   was loaded cold from the URL bar. All restored session, rendered the correct route, and
   showed a proper "Checking your session…" interstitial. No crashes, no wrong redirects.
5. **The newest work is the best work.** `MobileMenu` (committed mid-audit) has
   `role="dialog"`, `aria-modal="true"`, `aria-label="DateZA menu"`, focus moved into the
   dialog, and `body` scroll lock. That is a correct modal, not an approximation.
6. **Marketing pages are real content.** `/how-it-works`, `/dating-safely`, `/stories`,
   `/lifestyle`, `/privacy`, `/help`, `/careers`, `/cities`, `/get-the-app` are all written in
   confident, specific South African voice ("coffee in Rosebank", "the Sea Point promenade").
   Not lorem, not stubs.

## Top risks

1. **Legal exposure at launch (P0).** Settings states, in the product, that Terms, Privacy
   policy and Community guidelines *"have not been published yet"*. There is no `/terms` route
   at all. `/privacy` is a friendly explainer, not a POPIA instrument — no responsible party
   identity, no lawful basis, no retention periods, no data-subject rights, no information
   officer, no cross-border transfer disclosure. DateZA collects photographs, date of birth,
   suburb-level location and gender-interest data. Giving this to 1,000 South Africans is a
   regulatory problem before it is a product problem.
2. **CI is red on `main` (P0).** `npm run check` fails with 2 test failures introduced by the
   audited commit. The quality gate is currently not protecting the repo.
3. **The Safety centre's "Report a member" is a dead end (P0).** It is
   `<a href="/chats">`. A distressed member clicking Report in the safety hub lands on an
   empty Chats page with no report flow and no explanation.
4. **Likes is a hollow primary destination (P1).** Three of four tabs have no backend. For
   this account — and for every genuinely new member — Likes contains zero people, forever,
   until they happen to mutually like someone.
5. **Discover's filters are a trap (P1).** Every filter is client-side over the ~4–10 picks
   already fetched. Setting "within 5 km + 90%+ match + verified only" filters four people
   locally and lands in an empty state. The copy admits this; the elaborate UI contradicts it.
6. **Two fake controls (P1).** The Notifications "In-app notifications" ON switch is a
   decorative `<span>`. The Discover location gate is enforced by `localStorage`, so returning
   members are re-prompted on every new device or private window.

---

# B. PAGE-BY-PAGE AUDIT

## B.0 Route / page inventory

| Route | Component | Nav entry point | Auth | Status |
| --- | --- | --- | --- | --- |
| `/` | `LandingPage` | direct / logo | public | Working, visually older generation |
| `/how-it-works` | `HowItWorksPage` | public nav | public | Working |
| `/dating-safely` | `DatingSafelyPage` | public nav + footer | public | Working |
| `/stories` | `StoriesPage` | public nav | public | Working |
| `/lifestyle` | `LifestylePage` | public nav | public | Working |
| `/privacy` | `PrivacyPage` | public footer | public | Working, **not a legal policy** |
| `/help` | `HelpPage` | public footer | public | Working |
| `/careers` | `CareersPage` | public footer | public | Working ("no roles yet") |
| `/cities` | `CitiesPage` | landing city grid | public | Working |
| `/get-the-app` | `GetTheAppPage` | landing CTA | public | Working |
| `/sign-up` | `SignUpPage` | landing "Join free" | guest only | NOT TESTED |
| `/sign-in` | `SignInPage` | landing "Sign in" | guest only | NOT TESTED |
| `/forgot-password` | `ForgotPasswordPage` | sign-in link | guest only | NOT TESTED |
| `/reset-password` | `ResetPasswordPage` | emailed link | guest only | NOT TESTED |
| `/onboarding` | `OnboardingPage` | post-registration | protected | NOT TESTED |
| `/home` | `MemberHomePage` | none found | protected | Reachable, no inbound nav |
| `/signed-in` | `MemberHomePage` | none found | protected | Reachable, no inbound nav |
| `/discover` | `DiscoveryPage` (+ `RequireLocation`) | primary nav 1 | protected | Working, filters cosmetic |
| `/discovery` | → `/discover` | legacy bookmarks | protected | Redirect works |
| `/find` | `FindPage` | primary nav 2 | protected | Working, best page in app |
| `/likes` | `LikesPage` | primary nav 3 | protected | **1 of 4 tabs functional** |
| `/chats` | `ChatsPage` | primary nav 4 | protected | Working, unverified live |
| `/notifications` | `NotificationsPage` | bell icon | protected | Partial, 4 dead tabs |
| `/profile` | `ProfilePage` | account menu | protected | Working |
| `/profile/edit` | `EditProfilePage` | account menu | protected | Working |
| `/profile/photos` | → `/profile/edit#photos` | legacy | protected | Redirect works |
| `/profile/:id` | `ProfileDetailPage` | card / Find | protected | NOT TESTED |
| `/settings` | `SettingsPage` | account menu | protected | Partial, ~30% dead |
| `/settings/safety` | `SafetyPage` | account menu | protected | Broken report entry |
| `/safety` | → `/settings/safety` | legacy | protected | Redirect works |
| `*` | `NotFoundPage` | — | public chrome | Working, auth-blind |

Two orphan routes: `/home` and `/signed-in` both render `MemberHomePage` and have **no inbound
link anywhere in the app**. `/cities` and `/get-the-app` are *not* orphans — both are linked
from the landing markup.

---

## B.1 Landing page

- **Route:** `/`
- **Purpose:** convert a visitor into a registration.
- **Visual quality:** Good content, **Needs polish** structurally — visually an older generation than the authenticated app.
- **Functional status:** Working
- **Mobile status:** Working (hamburger, backdrop, Escape all wired)
- **Desktop status:** Working
- **Backend dependency:** None
- **Score: 3 / 5**
- **Evidence:** `screenshots/audit-landing-1440.png`

**What works.** Strong, specific brand voice ("NO DNA. JUST RSA. 🇿🇦"). Real South African
imagery, `loading="lazy"` on the city and lifestyle grids. Internal links are correctly
intercepted and routed client-side — `LandingPage.tsx` attaches a delegated click handler that
respects modifier keys and mouse button, so no full page reloads and no broken cmd-click. The
`/cities` and `/get-the-app` CTAs both resolve.

**What feels weak.** The entire page is one `landingMarkup` string rendered through
`dangerouslySetInnerHTML`, with the mobile menu driven by `getElementById` + `classList`
toggling and document-wide listeners. `AGENTS.md` already names this pattern legacy
presentation debt. Concretely, it produces measured accessibility defects:

- **Exactly one heading on the whole page** (`h1`); every visual section title is a styled
  `div`/`span`. Screen-reader and SEO section structure is absent.
- **Zero landmark elements** — no `<nav>`, no `<footer>`, no `<section>`. Only `<main>` exists,
  because the component returns `<main dangerouslySetInnerHTML=…>`.
- **No skip link.**
- Inline styles throughout, so the page cannot inherit the design tokens the rest of the app uses.

The landing mobile menu also has no focus trap and no `aria-modal`, which is now inconsistent
with both `PublicChrome` and the new `MobileMenu` — the app has three menu implementations of
three different qualities.

**Recommended next action.** Do not redesign. Port the landing to React components reusing
`PublicChrome`, purely to recover heading hierarchy, landmarks and the shared menu. Visual
output should be pixel-identical.

---

## B.2 Marketing pages

- **Routes:** `/how-it-works`, `/dating-safely`, `/stories`, `/lifestyle`, `/privacy`, `/help`, `/careers`, `/cities`, `/get-the-app`
- **Visual quality:** Good · **Functional:** Working · **Mobile/Desktop:** Working · **Backend:** None
- **Score: 4 / 5**

**What works.** `MarketingArticle` gives every page a consistent eyebrow / title / intro /
content / CTA rhythm, proper `h1` + `h2` hierarchy, `document.title` management with cleanup,
and `PublicChrome` supplies real `<nav>`/`<footer>` landmarks, `aria-current="page"`, Escape
handling and scroll lock. `/careers` honestly says there are no roles. `/get-the-app` honestly
says there is no store listing and explains Add to Home Screen instead. This is the standard
the landing page should be held to.

**Product semantic issue.** `/privacy` is titled "Privacy" and linked from the footer where a
user expects the privacy policy, but it is an explainer. It is honest about *behaviour* and
silent on *rights*. See P0-1.

---

## B.3 Sign-up / Sign-in / Password recovery — **NOT TESTED**

- **Routes:** `/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password`
- **Score: not scored — insufficient evidence**

`GuestRoute` correctly bounced `/sign-up` to `/discover` while a session was active, which is
itself a positive signal. I did not clear the session and register a fresh account, so I cannot
report on registration, duplicate-account behaviour, password error copy, disabled-button
states, network-failure handling, Safari behaviour, or the
`Register → Onboarding → Discover → verification modal` journey. The brief explicitly asks for
that journey to be confirmed; **it remains unconfirmed.** Treat this as the single largest gap
in this audit and the first thing to close.

---

## B.4 Onboarding — **NOT TESTED live**

- **Route:** `/onboarding` · **Score: not scored**

Source shows explicit unavailability state handling (`OnboardingPage.tsx` tracks an
`unavailable` message via `onboardingErrorMessage`), which is the right shape. The brief's
specific questions — refresh restoration, back/forward, photo upload, publication, step
progress, obsolete GPS/freshness wording, and which fields should migrate to Edit Profile —
cannot be answered without walking a fresh registration.

---

## B.5 Discover

- **Route:** `/discover`
- **Purpose:** a curated daily set of people.
- **Visual quality:** Good · **Functional:** Partial · **Mobile:** Working · **Desktop:** Needs polish · **Backend:** Existing contract, filters missing
- **Score: 3 / 5**
- **Evidence:** `screenshots/audit-discover-1440x900.png`, `audit-discover-1440-full.png`, `audit-discover-390.png`, `audit-discover-390-scroll1.png`, `audit-discover-390-scroll2.png`, `audit-discover-locationgate-1440.png`

**What works.** Real server data. Four profile cards rendered with photo, name, age, city,
distance ("JHB · 17 km"), a compatibility percentage, verification badge and bio snippet.
Facet chips (Online now / Nearby / New here), a Filter button, a right rail with recent
activity and profile completeness (93% with progress ring). At 1440 the page fits in one
viewport (content height 835 px vs 900 viewport) — no clipped or unreachable content, which I
verified by measurement after initially suspecting otherwise.

**What is broken (product-level, P1).** The filter sheet's own header says it:

> "These look through today's curated picks — they don't fetch a different set of people."

Every control in `DiscoverFilterSheet.tsx` — min age, max age, distance (5/10/25/50/100 km),
relationship intent, compatibility (70/80/90%+), interests, smoking, drinking, fitness,
verified-only, online, new-here — filters the **already-fetched 4–10 picks in memory**. A
member who sets a plausible combination will almost always land in an empty state and conclude
DateZA has nobody in their city. An honest sentence does not rescue a control that cannot do
what its shape promises.

**Coming soon items inside the filter sheet (explicit badges):** Religion, Education,
Children / family plans, "Presence beyond today's picks", plus Relationship intent, Interests,
Smoking, Drinking and Fitness whenever the server configuration omits those option groups.
That is 6 permanent + up to 5 conditional "Coming soon" rows in one sheet.

**Product semantic issues.**
- Copy promises "10 curated people each day"; the gauge reads "4 today" and four cards render.
  A member cannot tell whether 4 is what they *used* or what *exists*.
- "New here" appears on 3 of 4 cards. A badge that applies to nearly everyone communicates
  nothing.
- The reassurance ticks "Verified contact / Real people / Meaningful matches" sit above a set
  in which not every card carries a verification badge, so they read as batch guarantees the
  batch does not honour.

**Location gate (P1, `RequireLocation.tsx`).** Access is gated on
`hasConfirmedLocation(profile.id)` — a **`localStorage`** flag, not server profile state. A
member who already set their dating location is re-prompted with "Where you dating from?" on
every new device, new browser and private window. This fired on my session despite the account
having a saved location. Evidence: `audit-discover-locationgate-1440.png`.

**Privacy concern (P1).** The suburb search calls **Nominatim (OpenStreetMap) directly from the
browser**. Every keystroke of a member's home-suburb search goes to a third party with the
member's IP attached, from DateZA's origin, with no proxy and no consent surface. Evidence:
`audit-locgate-suburb-raw-osm-1440.png`. This conflicts with the `AGENTS.md` invariant against
exposing precise location, and with OSM's usage policy for production traffic.

**Desktop dead space.** At 1440 the three-column grid leaves a large empty band at the right;
content occupies roughly 68% of page width.

**Data quality note (BE/product, not FE).** The first card, "Vavo, 25", uses a **marketing
screenshot of a voice-recorder UI** — waveform and watermark, no face — as its primary photo,
displayed beside trust badges. Staging seed data, but it demonstrates there is no non-face /
photo-quality guardrail before a photo is presented as a dating profile.

---

## B.6 Find

- **Route:** `/find`
- **Purpose:** one person at a time, with rich context.
- **Visual quality:** Good · **Functional:** Working · **Mobile:** NOT TESTED (swipe) · **Desktop:** Needs polish · **Backend:** Existing contract
- **Score: 4 / 5** — the strongest authenticated page
- **Evidence:** `screenshots/audit-find-1440.png`, `audit-find-1440-fit.png`

**What works.** Genuinely a different experience from Discover, which is what the brief asks
for. One profile at a time, five listed compatibility reasons, full card detail (JHB, 17 km,
82% compatible, verified, bio), three correctly-sized action buttons, a recent-activity rail,
and a profile-completeness card. **Openers work** — the "Send … an opener" panel is live, which
supersedes the previously-documented blocked status. `FindRightRail` models an
`activityUnavailable` state explicitly rather than silently rendering empty, which is the
correct pattern.

**What feels weak.** Same 1440 imbalance as Discover — roughly 460 px of dead space at the
right edge. Mobile swipe gestures were **not tested**.

**Not testable here.** End-of-deck and allowance states were not reachable with this account's
data.

---

## B.7 Likes

- **Route:** `/likes`
- **Purpose:** who liked you, who you liked, and mutual matches.
- **Visual quality:** Needs polish · **Functional:** **Placeholder for 3 of 4 tabs** · **Mobile:** Working · **Desktop:** Needs polish · **Backend:** **Missing contract**
- **Score: 2 / 5**
- **Evidence:** `screenshots/audit-likes-1440.png`

**What is broken.** `LikesInterestBoundary.tsx` confirms in source:

| Tab | Backing | Reality |
| --- | --- | --- |
| Liked you | none | permanent empty state: *"Incoming likes aren't available yet"* |
| You liked | none | permanent empty state: *"Your sent likes aren't listed yet"* |
| Mutual | `GET /api/v1/matches` | **real** |
| All | composite | two boundaries + mutual |

So one of the four primary navigation destinations in the product delivers a single working
list, and for any new member that list is empty. There is no Like Back, no pagination, no
compatibility surface and no messaging CTA to exercise, because there are no rows.

**Product semantic issue.** The page subtitle reads *"People who are interested in you"* while
incoming likes are precisely what cannot be shown.

**Visual defects (measured).**
- **Duplicate navigation:** a left sidebar lists All likes / Liked you / You liked / Mutual
  likes, and the main column repeats the *same four* filters as a horizontal tab row.
- The "YOUR MATCHES 0" card renders the zero as a thin outline glyph that reads as broken.
- The same limitation is restated **four times** on one screen.
- Count badges are inconsistent across tabs; large desktop dead space.

**Mockup-only features from the brief:** Popularity, Recent visitors, Boost, Premium and
Online state are **not present** in this page at all — correctly, since none are supported.
No fake affordances here.

**Backend gaps:** incoming-likes list, outgoing-likes list.

---

## B.8 Chats

- **Route:** `/chats`
- **Visual quality:** Needs polish · **Functional:** Working (unverified live) · **Mobile:** Needs polish · **Desktop:** Needs polish · **Backend:** Existing contract
- **Score: 3 / 5**
- **Evidence:** `screenshots/audit-chats-1440.png`, `audit-chats-390.png`

**What works — verified in source and tests, not live.** Real endpoints:
`GET /api/v1/conversations`, `GET /api/v1/conversations/:id/messages`,
**`POST /api/v1/conversations/:id/messages`**, with cursor pagination on both lists. Messaging
is genuinely implemented. I could not exercise it because the account has zero matches, so
send, unread state, timestamps, the composer and the profile rail are **unverified live**.

**Honest absences.** There are **no** typing indicators, presence, read receipts, reactions,
attachments, voice, video, mute, leave or archive controls — not as disabled buttons, but
absent from the DOM. Per the brief's instruction not to credit visible controls, the inverse
also deserves credit: nothing here is faked.

**Visual defects (measured).**
- **"No conversations yet" renders twice** at 1440 — once in the conversation list, once in the
  detail pane.
- The **third column (profile rail) is entirely blank white** with no placeholder or explanation.
- Header "Chats / Your connections" is cramped and misaligned at the top-right.
- **Mobile padding bug:** the `h1` sits at **`left: 2px`** at 390 px — flush against the screen
  edge. `/likes` measures `left: 16px`. Chats is the outlier.
- No search and no filters exist (the brief asks; they are simply not built).

**Confirmed sound at 390:** `document.scrollWidth === 390` (no horizontal overflow) and the
bottom tab bar is correctly fixed at y 765–844, 79 px tall.

---

## B.9 Rich profile (other member) — **NOT TESTED**

- **Route:** `/profile/:id` · **Score: not scored**

With no matches and no likes, no other member's profile was reachable through normal
navigation. Photo gallery, optional-section collapse, sparse-profile feel, private-data leakage,
safety actions, Like/Pass and back-navigation origin are all **unverified**. Given that this is
the page where block and report live, it should be the second priority to verify after auth.

---

## B.10 My Profile / How You Appear

- **Route:** `/profile`
- **Visual quality:** Good with one real defect · **Functional:** Working · **Mobile:** NOT TESTED · **Desktop:** Needs polish · **Backend:** Existing contract
- **Score: 3 / 5**
- **Evidence:** `screenshots/audit-myprofile-1440.png`

**What works.** Owner preview with gallery, photo counter (1/3), prompts, facts and a
compatibility card. It does **not** fabricate self-compatibility or self-distance — the
specific fabrications the brief warns about are absent.

**What is broken (P1, measured).** The **Profile strength card text wraps to roughly one word
per line** in the narrow left rail. Confirmed as a container-width defect, not a font issue:
the identical card renders correctly on the full-width Settings page. It reproduces on both
`/profile` and `/profile/edit`, so it is one shared component in one narrow context.

**Product semantic issues.**
- "This is close to what other people see" is honest but vague; a member cannot tell what
  differs.
- This page says *"close to what other people see"* while Edit Profile's preview card claims
  *"how others see your profile"* — **two different confidence claims about two previews that
  do not match each other.**
- The sidebar surfaces the full Edit Profile navigation on a read-only page, blurring viewing
  and editing.

---

## B.11 Edit Profile

- **Route:** `/profile/edit`
- **Visual quality:** Good · **Functional:** Partial · **Mobile:** NOT TESTED · **Desktop:** Needs polish · **Backend:** Existing contract
- **Score: 3 / 5**
- **Evidence:** `screenshots/audit-editprofile-1440.png`

**What works.** Sectioned form with a live preview card (name, age, verification, location,
relationship goal, bio, photo count). "Interested in" renders as chips, not a raw select —
correct control choice per `AGENTS.md`. Date of birth uses sane selects. Display-name character
counter present.

**What is broken.**
- **Dating location does not echo back after saving.** I set *Sandton, Johannesburg*; the field
  still shows a placeholder. A member cannot confirm what location they are dating from — which
  is exactly the value the Discover gate depends on. (P1)
- The **Profile strength wrap defect** repeats here (same shared component).

**What feels weak.**
- "Find area" renders grey/disabled-looking beside pink primary buttons — inconsistent affordance.
- The display-name character counter floats visually disconnected below its input.
- "Everyone" in "Interested in" appears to be a client-side-only option; whether the server
  accepts it was **not verified**.

**Coming soon:** `RealMe — Coming soon` (`EditProfilePage.tsx:758`). Correctly framed as
unavailable rather than claimed — this is the misleading-label risk the brief calls out, and it
is currently handled honestly.

**Not verified:** photo upload/reorder/delete, dirty-state guards, deep links, validation
failures, mobile layout.

---

## B.12 Settings

- **Route:** `/settings`
- **Visual quality:** Good · **Functional:** Partial · **Mobile:** Working · **Desktop:** Needs polish · **Backend:** Mixed
- **Score: 2 / 5**
- **Evidence:** `screenshots/audit-settings-1440.png`, `dateza-settings-1440.png`, `dateza-settings-390.png`, `dateza-settings-account-390.png`

**Dead / future-only rows, quoted from `SettingsPage.tsx`:**

| Row | Status shown | Line |
| --- | --- | --- |
| Private mode | Unavailable | 522 |
| Push notifications | Unavailable | 529 |
| Email notifications | Unavailable | 530 |
| RealMe | Coming later | 632 |
| Download my data | Unavailable | 645 |
| Help centre | Unavailable | 650 |
| Contact support | Unavailable | 651 |
| **Terms** | **Unavailable** | 656 |
| **Privacy policy** | **Unavailable** | 657 |
| **Community guidelines** | **Unavailable** | 658 |

Roughly **3 of 10 sidebar sections** (Payment & plans, Data & permissions, Help & support)
resolve to content that is mostly "Unavailable". "Payment & plans" advertises a premium tier
that does not exist.

**Sign-out asymmetry (P1, measured).** The **mobile menu contains "Sign out"**. The **desktop
top-nav account menu does not** — I enumerated `.shell-account a, .shell-account button` and
found no sign-out. On desktop the only reachable control is `.settings-nav__logout`, inside
Settings at (x 41, y 363). A desktop member must navigate into Settings to leave the product.

**Copy audit hits.** Engineering language leaking to members: *"Session active — This browser
is signed in securely"* and a change-password description referencing *"password sessions"*.
Members do not have a concept of a session.

**Good.** Account state is presented authoritatively from the server, profile completion is
real (72% in the test fixture, 93% live), and the masked email is masked.

---

## B.13 Safety centre

- **Route:** `/settings/safety`
- **Visual quality:** Good · **Functional:** **Partial — primary action broken** · **Mobile:** NOT TESTED · **Desktop:** Working except report · **Backend:** Existing contract
- **Score: 2 / 5**
- **Evidence:** `screenshots/audit-safety-1440.png`

**Real, server-backed capability** (`src/lib/api/safety.ts`, with tests):

- `POST /api/v1/profiles/:id/block` — treats `created:false` as success (idempotent, correct)
- `DELETE /api/v1/profiles/:id/block`
- `POST /api/v1/profiles/:id/report` with a documented `ProfileReportReason` enum and optional note
- `GET /api/v1/blocks`

**This is not safety theatre.** The capability is genuine and the report reasons are real.

**But the entry point is broken (P0-3).** I enumerated every `a.safety-action` on the page.
There is exactly one, and it is:

```
{ label: "Report a member", href: "/chats" }
```

It is styled as an actionable row with a chevron, inside a section titled "Safety tools", on the
page a frightened member is told to go to. It navigates to Chats — which is **empty** for
anyone without matches. No report flow, no member picker, no explanation.

**Honestly labelled unavailable:** "Mute conversations — Unavailable" (`SafetyPage.tsx:177`)
and "Help & support — A verified support channel is not available yet" (line 216). I initially
suspected the "Unavailable" label was clipped; DOM measurement disproved it (right edge 443 vs
container 449). Not a defect.

**Informational content, correctly framed:** the safety checklist (verified contact / profile
visibility / block and report), "Important to know", and a "Need urgent help?" card that
states plainly *"DateZA is not an emergency service."* That is the right disclaimer.

**Label inconsistency:** the page is titled "Safety centre", the sidebar entry is
"Privacy & safety", and the account menu says "Safety centre". Three labels, one destination.

**Missing from the brief's list:** Hide profile, Dating guide, Emergency guidance and
Community guidelines are not implemented as working capability. "Learn more" and "Safety tips"
are in-page anchors (`#guide`, `#tips`) — real, but informational.

---

## B.14 Notifications

- **Route:** `/notifications`
- **Visual quality:** Needs polish · **Functional:** Partial · **Mobile:** Needs polish · **Desktop:** Needs polish · **Backend:** Partial contract
- **Score: 2 / 5**
- **Evidence:** `screenshots/audit-notifications-1440.png`, `notifications-390.png`

**What works, and works well.** Loading skeletons with `aria-live` and an accessible label; a
real error state with a working "Try again"; a real empty state ("You're all caught up") with a
Discover CTA; date grouping with proper `h2` headings; `<time dateTime>`; "Mark all read" that
shows a pending label and disables itself; per-item `aria-label` that announces unread status
and the mark-read action. This is the most complete state-modelling in the app.

**What is broken.**

1. **Fake control (P1).** Line 191:
   `<span className="notifications-switch notifications-switch--on" aria-label="In-app notifications enabled" />`
   A decorative `<span>` styled as a pink ON toggle, with an `aria-label` but **no role, no
   handler, no keyboard access**. Sighted members see a live switch they cannot operate;
   screen-reader users get a labelled element with no role. This is worse than an honest
   "Unavailable" row — it is the one place the app pretends.
2. **4 of 5 filter tabs are disabled "Coming soon"** — Likes, Matches, Messages, Activity.
   80% of the primary control row is dead (lines 134–138).
3. **Notifications never navigate.** Each item is a `<button>` whose only job is mark-read, and
   `disabled={!unread || pending}`. Once read, the row becomes an **inert disabled element**.
   The only notification in the system, "Welcome to DateZA", tells the member to complete their
   profile and **does not link to the profile editor**.
4. Push and Email notification channels are both labelled "Coming soon" (lines 189–190).

**Information architecture problem.** The page renders the **Settings sidebar** (Account,
Privacy, Notifications, Preferences, Blocked users, Verification, Payment & plans, Data &
permissions, Help & support, About) while its own `h1` says "Notifications". So a primary
destination reached from the bell icon is framed as a Settings sub-page. It also inherits the
dead "Payment & plans" entry.

**Overhead vs content.** One notification in the entire system is surrounded by a full settings
sidebar and three rail cards, two of which say essentially the same thing about staying updated.

**Unsupported event types from the brief:** profile views, push, quiet hours, system
announcements and opener notifications are all absent or unavailable. Only a generic welcome
event type was observed.

---

## B.15 Global navigation

- **Score: 4 / 5**

**What works.** Desktop top nav with four primary destinations (Discover / Find / Likes /
Chats), bell icon, named account menu. Mobile: compact header (logo, bell, hamburger, avatar)
plus a correct fixed bottom tab bar. Active route highlighting works — Likes was correctly
marked in the drawer while on `/likes`. Legacy redirects (`/discovery`, `/safety`,
`/profile/photos`) all resolve. Deep links and route restoration verified on every route.

**The new `MobileMenu` is the best component in the app.** Measured: `role="dialog"`,
`aria-modal="true"`, `aria-label="DateZA menu"`, focus moved onto the dialog,
`body { overflow: hidden }`, grouped DATE / ACCOUNT sections with `aria-label`s, and a working
**Sign out**.

**Issues.**
- **Sign-out asymmetry** — present on mobile, absent from the desktop account menu (P1).
- **Duplicate navigation** — the mobile drawer repeats the four destinations already in the
  bottom tab bar (P2).
- **Avatar renders as a flat green circle** with no photo, on an account that has 3 photos.
  Worth confirming whether the header avatar reads the primary photo at all.
- **Three menu implementations** of differing quality: landing (imperative DOM), `PublicChrome`
  (React, no focus trap), `MobileMenu` (correct).

---

## B.16 404 / Not found

- **Route:** `*` · **Score: 3 / 5**

Works: correct `document.title` ("Page not found — DateZA"), a clear `h1`, honest copy, and a
real `<nav>` landmark.

**Broken semantics (P1).** It renders **public chrome to a signed-in member** — "Sign in" and
"Join free" buttons, marketing nav (How it works, Success stories, SA lifestyle), marketing
footer. The only recovery is "Back to home", which lands on the **marketing landing page**, not
back in the app. A signed-in member who mistypes a URL is shown a signup pitch and ejected from
the product.

---

# C. BROKEN LINKS / DEAD ACTIONS

| # | Location | Element | Actual behaviour | Priority | Owner |
| --- | --- | --- | --- | --- | --- |
| C1 | `/settings/safety` | "Report a member" row (chevron) | `<a href="/chats">` → empty Chats, no report flow | **P0** | FE |
| C2 | `/notifications` | "In-app notifications" ON switch | decorative `<span>`, no role/handler/keyboard | **P1** | FE |
| C3 | `/notifications` | Likes, Matches, Messages, Activity tabs | `disabled`, "Coming soon" | P1 | FE + BE |
| C4 | `/notifications` | "Welcome to DateZA" item | marks read only; never navigates to the profile editor it recommends | P1 | FE |
| C5 | `/notifications` | any read notification | becomes an inert `disabled` button | P1 | FE |
| C6 | `/settings` sidebar | "Payment & plans" | resolves to premium-unavailable content | P1 | Product |
| C7 | `/settings` sidebar | "Data & permissions", "Help & support" | mostly "Unavailable" rows | P1 | FE + BE |
| C8 | `/settings` | Terms / Privacy policy / Community guidelines | "have not been published yet" | **P0** | Product + Legal |
| C9 | `*` (404) | "Back to home" | ejects a signed-in member to marketing landing | P1 | FE |
| C10 | desktop account menu | (absent) sign-out | no sign-out on desktop; only inside Settings | P1 | FE |
| C11 | `/likes` | "Liked you", "You liked" tabs | permanent empty states, no backend | P1 | BE |
| C12 | `/discover` filter sheet | all filter controls | filter in-memory only; cannot widen the pool | P1 | FE + BE |
| C13 | `/home`, `/signed-in` | — | orphan routes, no inbound link | P2 | FE |

No 404s from internal links, no wrong-page navigations, and no silent JS failures were observed.

---

# D. COMING SOON / PLACEHOLDER INVENTORY

| Feature | Page | Current UI | Why not working | FE missing? | BE missing? | Build / Remove / Hide |
| --- | --- | --- | --- | --- | --- | --- |
| Incoming likes | `/likes` | full empty state | no endpoint | no | **yes** | **Build (BE)** — primary destination |
| Outgoing likes | `/likes` | full empty state | no endpoint | no | **yes** | **Build (BE)** |
| Server-side discovery search | `/discover` | full filter sheet | client-only filtering | partial | **yes** | **Build (BE)**, gate UI until then |
| Religion filter | Discover sheet | "Coming soon" badge | no field | no | yes | Hide until BE |
| Education filter | Discover sheet | "Coming soon" badge | no field | no | yes | Hide until BE |
| Children / family plans filter | Discover sheet | "Coming soon" badge | no field | no | yes | Hide until BE |
| Presence beyond picks | Discover sheet | "Coming soon" badge | no presence service | no | yes | Hide |
| Interests / lifestyle filters | Discover sheet | conditional "Coming soon" | server config may omit groups | no | yes | Leave (degrades correctly) |
| Notification filters ×4 | `/notifications` | disabled + "Coming soon" | no per-type query | no | yes | **Hide** — 80% dead control row |
| Push notifications | `/notifications`, `/settings` | "Coming soon" / "Unavailable" | no push registration | yes | yes | Hide |
| Email notifications | `/notifications`, `/settings` | "Coming soon" / "Unavailable" | no preference API | yes | yes | Hide |
| In-app notifications toggle | `/notifications` | **fake ON switch** | decorative span | yes | yes | **Fix now** — make static text |
| Mute conversations | `/settings/safety` | "Unavailable" | no mute API | no | yes | Leave (honest) |
| Help & support channel | `/settings/safety`, `/settings` | "Unavailable" | no support channel | no | yes | Product decision |
| RealMe | `/profile/edit`, `/settings` | "Coming soon" / "Coming later" | no identity verification | no | yes | Leave, never imply it exists |
| Private mode | `/settings` | "Unavailable" | no server support | no | yes | Leave |
| Download my data | `/settings` | "Unavailable" | no export | no | yes | **Build** — POPIA-adjacent |
| Help centre | `/settings` | "Unavailable" | not published | — | — | Product |
| Terms | `/settings` | "Unavailable" | **not published** | — | — | **Publish — launch blocker** |
| Privacy policy | `/settings` | "Unavailable" | **not published** | — | — | **Publish — launch blocker** |
| Community guidelines | `/settings` | "Unavailable" | **not published** | — | — | **Publish — launch blocker** |
| Find unavailable | `/find` | "Find isn't available for DateZA yet." | brand gating fallback | no | no | Leave (guard) |
| Discover unavailable | `/discover` | "Discover isn't available for DateZA yet." | brand gating fallback | no | no | Leave (guard) |
| Careers | `/careers` | "no open roles listed yet" | intentional | no | no | Leave |
| App store listing | `/get-the-app` | "no separate store listing yet" | intentional | no | no | Leave |

**Not faked anywhere** (credit where due): typing indicators, presence, read receipts,
reactions, attachments, voice, video, Boost, Premium, Popularity, Recent visitors. These are
absent from the DOM rather than present-but-dead.

---

# E. VISUAL CONSISTENCY ISSUES

**VISUALLY CURRENT** — Find, Discover, Notifications, My Profile, Edit Profile, Settings,
Safety centre, marketing pages, `MobileMenu`, bottom tab bar. Consistent pink `#E8375A` brand
usage, card radii, pill buttons, shared `shell-*` empty-state and skeleton patterns.

**VISUALLY OUTDATED** — the **landing page**. Inline styles, no design tokens, one heading, no
landmarks, imperative menu. It works and it is on-brand, but structurally it predates the rest.

**PARTIALLY MIGRATED**
- **Likes** — duplicate sidebar + tab-row navigation, inconsistent count badges, a "0" glyph
  that reads as broken, four restatements of one limitation.
- **Chats** — duplicated empty state, an entirely blank third column, cramped header, and a
  mobile `h1` at `left: 2px` where every other page uses 16.
- **Notifications** — mixes a primary destination with the Settings sidebar; two rail cards say
  the same thing.
- **Profile strength card** — correct at full width, **broken word-wrap in narrow rails**.

**Cross-app**
- Three menu implementations of three different accessibility qualities.
- Three labels for one destination: "Safety centre" / "Privacy & safety" / "Safety centre".
- Two different confidence claims for the profile preview: "close to what other people see"
  vs "how others see your profile".
- Inconsistent affordance: "Find area" reads disabled next to pink primaries.
- Desktop dead space: Discover and Find use ~68% of width at 1440.

---

# F. MOBILE ISSUES

Verified at **390 × 844**. **834 × 1112 and 1920 × 1080 were not tested.**

| # | Route | Issue | Priority |
| --- | --- | --- | --- |
| F1 | `/chats` | `h1` at `left: 2px` — no page padding; `/likes` uses 16px | P1 |
| F2 | `/discover` | "Nearby" facet label wraps awkwardly; facet card content appears to overflow its chip | P2 |
| F3 | `/discover` | cards are very tall — one per row means long scrolls through only 4 people | P2 |
| F4 | `/discover` | Like heart is small and top-right — poor thumb reach on a card-per-screen layout | P2 |
| F5 | header | avatar renders as a flat green circle despite the account having 3 photos | P2 |
| F6 | mobile drawer | duplicates the four bottom-tab destinations | P2 |
| F7 | all | mobile swipe gestures on Find **not tested** | unknown |

**Verified sound at 390:** no horizontal overflow (`scrollWidth === 390`) on Discover, Likes or
Chats; bottom tab bar correctly fixed (y 765–844, 79 px) with no content overlap; mobile menu
locks scroll and traps focus correctly; empty states render in-viewport.

---

# G. DESKTOP ISSUES

Verified at **1440 × 900**. **1920 × 1080 not tested.**

| # | Route | Issue | Priority |
| --- | --- | --- | --- |
| G1 | `/profile`, `/profile/edit` | Profile strength card wraps ~one word per line in the narrow rail | P1 |
| G2 | `/chats` | third column entirely blank white, no placeholder | P1 |
| G3 | `/chats` | "No conversations yet" rendered twice | P1 |
| G4 | `/likes` | duplicate sidebar + tab-row navigation for the same four filters | P1 |
| G5 | account menu | no sign-out | P1 |
| G6 | `/discover`, `/find` | ~460 px right-side dead space; content ≈68% of width | P2 |
| G7 | `/chats` | header "Chats / Your connections" cramped and misaligned | P2 |
| G8 | `/likes` | "0" renders as a thin outline glyph reading as broken | P2 |
| G9 | `/notifications` | full settings sidebar + 3 rail cards around 1 notification | P2 |

---

# H. CONSOLE / NETWORK ISSUES

Instrumented with an injected console/network recorder across the journey, then removed.

**Errors: 0. Failed requests: 0. 4xx: 0. 5xx: 0.** This is genuinely clean.

| # | Finding | Detail | Priority |
| --- | --- | --- | --- |
| H1 | React Router future-flag warnings ×2 | `v7_startTransition`, `v7_relativeSplatPath` | P2 |
| H2 | Duplicate requests in dev | Caused by `StrictMode` in `main.tsx` double-invoking effects. **Development artefact, not a production bug** — verified, not a defect | — |
| H3 | Third-party geocoding | Suburb search calls **Nominatim/OSM directly from the browser** with member IP and home-suburb keystrokes | **P1 (privacy)** |
| H4 | Bundle size | single **553 kB** JS chunk (**149 kB gzip**) + 160 kB CSS (29 kB gzip); no code splitting. Vite warns explicitly | P1 (SA mobile data) |
| H5 | Accessibility warnings | none surfaced at runtime; the landing-page a11y defects are structural and silent | P1 |

No request loops, no unnecessary refetch storms, no failed media, no expired signed URLs and no
parsing errors were observed.

---

# I. BACKEND CAPABILITY GAPS

| # | Gap | Blocks | Priority |
| --- | --- | --- | --- |
| I1 | Incoming-likes list | `/likes` "Liked you" — a primary destination | P1 |
| I2 | Outgoing-likes list | `/likes` "You liked" | P1 |
| I3 | Server-side discovery search / filtering | the entire Discover filter panel | P1 |
| I4 | Server-persisted location confirmation | members re-prompted on every device | P1 |
| I5 | Server-side suburb geocoding proxy | removes third-party IP/location exposure | P1 |
| I6 | Notification type taxonomy + per-type query | 4 dead filter tabs; only one event type exists | P1 |
| I7 | Photo moderation / non-face detection | non-photo content shown beside trust badges | P1 |
| I8 | Dating-location read-back | member cannot confirm a saved location | P1 |
| I9 | Data export | "Download my data" — POPIA-adjacent | P1 |
| I10 | Presence / online state | "Online now" facet has no real presence source | P2 |
| I11 | Conversation mute | Safety centre "Unavailable" | P2 |
| I12 | Identity / photo verification (RealMe) | "Coming later" | P2 |
| I13 | Push + email notification channels | "Coming soon" | P2 |
| I14 | Support channel | Help & support "Unavailable" | P2 |
| I15 | Private mode | Settings "Unavailable" | P2 |
| I16 | Extended profile fields (religion, education, children) | 3 "Coming soon" filters | P2 |

---

# J. PRODUCT DECISIONS NEEDED

1. **What ships without Terms, a POPIA-grade Privacy Policy and Community Guidelines?**
   Current answer must be *nothing*. Who drafts them, and by when?
2. **Does Likes survive as a primary destination before incoming likes exist?** Options: build
   the endpoints, merge Likes into Matches, or demote it out of primary nav. A structurally
   empty top-level tab is worse than one fewer tab.
3. **Should Discover filters exist before server-side search?** Options: hide the sheet, reduce
   it to the 2–3 facets that meaningfully affect a 10-person set, or build the endpoint.
4. **What is the daily allocation, and how is it described?** "10 curated people each day" vs a
   "4 today" gauge vs 4 cards. Pick one truth and one sentence.
5. **Is "Payment & plans" removed until a premium tier exists?** Advertising a paid tier that
   cannot be bought is a credibility cost with no upside.
6. **Does DateZA need a support channel before launch?** Both Settings and the Safety centre
   currently tell members support does not exist. For a dating product handling reports, that
   is a hard question, not a P2.

---

# K. PRODUCTION READINESS SCORES

| Page | Score | One-line reason |
| --- | --- | --- |
| Landing | 3 / 5 | Works and on-brand; structurally an older generation, a11y-weak |
| Marketing pages | 4 / 5 | Real content, correct semantics, honest about gaps |
| Sign-up / Sign-in | — | **NOT TESTED** — active session blocked guest routes |
| Onboarding | — | **NOT TESTED** — no fresh registration performed |
| Discover | 3 / 5 | Real data and good shell; filters cannot widen the pool; location gate re-prompts |
| Find | 4 / 5 | Strongest page; openers work; desktop dead space; swipe untested |
| Likes | 2 / 5 | 1 of 4 tabs functional; duplicate nav; empty by construction |
| Chats | 3 / 5 | Messaging genuinely built; unverified live; duplicated empty state, blank rail, mobile padding bug |
| Rich profile (`/profile/:id`) | — | **NOT TESTED** — unreachable with 0 matches |
| My Profile | 3 / 5 | Honest and complete; broken text wrap; conflicting preview claims |
| Edit Profile | 3 / 5 | Good controls; location does not read back; wrap defect |
| Settings | 2 / 5 | ~30% of nav is "Unavailable"; no desktop sign-out; engineering copy |
| Safety centre | 2 / 5 | Real block/report underneath; **primary Report entry is a dead end** |
| Notifications | 2 / 5 | Best state-modelling in the app, wrapped around one event type, 4 dead tabs, 1 fake switch |
| Global navigation | 4 / 5 | Correct nav, excellent new mobile menu; desktop sign-out missing |
| 404 | 3 / 5 | Works; shows signup chrome to a signed-in member |

---

# L. PRIORITIZED WORK PLAN

## P0 — must fix before anyone real signs in

| # | Issue | Owner |
| --- | --- | --- |
| P0-1 | Publish Terms, a POPIA-compliant Privacy Policy, and Community Guidelines; wire `/terms` and replace the Settings "Unavailable" rows | Product + Legal + FE |
| P0-2 | Fix the 2 failing tests; get `npm run check` green | FE |
| P0-3 | Replace Safety centre "Report a member" → `/chats` with a real report entry (member picker, or route to a page that explains where reporting lives) | FE |

## P1 — major product completeness

Frontend-owned: fake notifications toggle (C2); Profile strength wrap (G1); Chats duplicated
empty state + blank rail + mobile padding (G2, G3, F1); Likes duplicate navigation (G4);
desktop sign-out (G5); auth-aware 404 (C9); hide the 4 dead notification tabs (C3); notification
click destinations (C4, C5); landing landmarks + heading hierarchy; Discover allocation copy;
route-level code splitting (H4).

Backend-owned: incoming/outgoing likes (I1, I2); server-side discovery search (I3);
server-persisted location confirmation (I4); geocoding proxy (I5); notification taxonomy (I6);
photo moderation (I7); location read-back (I8); data export (I9).

Product-owned: J1–J6.

## P2 — polish

React Router future flags; Discover/Find desktop dead space; Chats header alignment; Likes "0"
glyph; Notifications rail redundancy; mobile drawer/tab-bar duplication; header avatar photo;
mobile facet wrapping; unify the three menu implementations; unify Safety labels; retire
`/home` and `/signed-in`.

## Quick wins (< 1 day each)

1. Fix the 2 failing tests (P0-2) — likely a query specificity change.
2. Turn the fake notifications toggle into static text (C2).
3. Hide the 4 disabled notification filter tabs (C3).
4. Fix the Chats mobile `h1` padding: `left: 2px` → 16px (F1).
5. Remove one of the two duplicated Chats empty states (G3).
6. Add sign-out to the desktop account menu, reusing the mobile-menu handler (G5).
7. Remove the duplicated Likes sidebar navigation (G4).
8. Make the 404 auth-aware — "Back to Discover" for signed-in members (C9).
9. Fix the Profile strength card wrap in narrow rails (G1).
10. Fix the two "Session active" / "password sessions" copy strings.

## Medium work (2–5 days each)

Report entry point (P0-3); route-level code splitting; landing page ported to React components
for landmarks and heading hierarchy; server-side geocoding proxy; server-persisted location
confirmation; Chats third-column placeholder + header; Discover allocation copy and badge
thresholds.

## Major features

Server-side discovery search; incoming/outgoing likes; notification taxonomy and click
destinations; photo moderation; RealMe identity verification; presence; push notifications;
premium/payments; support channel.

---

# M. NEXT FIVE TICKETS

**Ticket 1 — `fix(ci): restore a green quality gate`** · P0 · FE · < 1 day
Two tests fail on `bfa0b85` because the new shell nav adds a second "Edit profile" link:
`ProfilePage.test.tsx > loads the owner preview…` and
`SettingsPage.test.tsx > shows authoritative account state…` both throw
*"Found multiple elements with the role link and name /edit profile/i"*. Scope the queries to
the page region rather than the document. **Done when** `npm run check` exits 0.

**Ticket 2 — `fix(safety): make Report a member reach a real report flow`** · P0 · FE · 2–3 days
`SafetyPage.tsx` renders exactly one `a.safety-action`, `href="/chats"`. Replace with a real
entry: a member picker over blockable/reportable people, or an explicit explanation that
reporting happens from a profile or conversation, with a route that is not empty. Must work for
a member with **zero** conversations. Reuse `reportProfile` and the existing
`ProfileReportReason` enum. **Done when** a member with no matches can start and submit a
report from the Safety centre, with success, validation and failure states.

**Ticket 3 — `chore(legal): publish Terms, Privacy Policy and Community Guidelines`** · P0 · Product + Legal + FE · blocking
Draft POPIA-compliant documents (responsible party, lawful basis, categories collected —
photographs, DOB, suburb, gender interest — retention, data-subject rights, information officer,
cross-border transfers, cookies). Add `/terms` and `/community-guidelines`, upgrade `/privacy`,
link from the public footer and Settings, and replace the three "Unavailable" rows.
**Done when** no legal row in Settings says "not published yet".

**Ticket 4 — `fix(ui): honest controls and dead-state cleanup sweep`** · P1 · FE · 2 days
Bundle the quick wins that most damage credibility: the fake in-app notifications switch → static
text; hide the 4 disabled notification tabs; desktop account-menu sign-out; auth-aware 404;
de-duplicate the Likes sidebar and the Chats empty state; Chats mobile `h1` padding; Profile
strength wrap; the two engineering copy strings. **Done when** no control in the app appears
operable but is not, and `npm run check` stays green.

**Ticket 5 — `feat(discovery): make location confirmation server-truthful`** · P1 · FE + BE · 3–4 days
`RequireLocation.tsx` gates on a `localStorage` flag, so returning members are re-prompted on
every new device. Read confirmation from server profile state instead. In the same slice, move
suburb geocoding behind a DateZA/D8N endpoint so member IPs and home-suburb keystrokes stop
going directly to Nominatim, and make the saved location read back into Edit Profile.
**Done when** a member who confirmed location on device A is not re-prompted on device B, no
browser request reaches a third-party geocoder, and Edit Profile displays the saved area.

Rationale for the order: 1 restores the gate that protects everything after it; 2 and 3 are the
two ways DateZA could actually harm or expose a member or the company; 4 buys the largest
credibility gain per hour; 5 fixes the first thing a returning member hits and closes a privacy
exposure.

---

# N. VERIFICATION RESULTS

**The repository is NOT green.**

| Command | Result |
| --- | --- |
| `npm run check` | **FAIL** — 2 failed / 242 passed (244 tests, 38 files, 27.9 s) |
| `npm run build` | **PASS** — `tsc -b && vite build`, 191 modules, built in 2.13 s |
| `git diff --check` | **PASS** — clean |
| `git status --porcelain` | **Clean** — no product code modified by this audit |

**Failing tests (both introduced by the audited commit `bfa0b85`):**

```
FAIL src/features/profile/ProfilePage.test.tsx
     > My profile / How you appear > loads the owner preview with public fields and owner chrome
     TestingLibraryElementError: Found multiple elements with the role "link" and name `/edit profile/i`

FAIL src/features/profile/SettingsPage.test.tsx
     > SettingsPage > shows authoritative account state and profile completion
     TestingLibraryElementError: Found multiple elements with the role "link" and name `/Edit profile/`
```

**Root cause:** `bfa0b85` added "Edit profile" to `ACCOUNT_NAV_ITEMS`, which the shell now
renders on every authenticated page. Page-scoped queries became document-ambiguous. The
production behaviour is correct; the test queries are now under-specified.

**Build output:**

```
dist/index.html                   0.88 kB │ gzip:   0.52 kB
dist/assets/index-BAtNoclR.css  160.31 kB │ gzip:  28.64 kB
dist/assets/index-BuC2dJsi.js   552.88 kB │ gzip: 149.30 kB
(!) Some chunks are larger than 500 kB after minification.
```

One monolithic JS chunk, no route-level code splitting — see H4.

**Instrumentation removed.** The temporary console/network recorder and the CSS capture-scaling
transform were injected via CDP into the browser only (never into source) and were verified
removed: `window.__dz === "undefined"`, no `#dz-fit-style` element, `documentElement.transform
=== "none"`, device metrics override cleared.

**Not committed. Not deployed.** The only files this audit adds are this report and the
screenshots beside it, both untracked and safe to delete.

---

## Evidence index

All screenshots in `./screenshots/`. Desktop frames at 1440 × 900 are low-resolution by
necessity (see the scope statement) — reliable for layout, not for fine type.

| File | Route | Viewport |
| --- | --- | --- |
| `audit-landing-1440.png` | `/` | 1440 × 900 |
| `audit-discover-locationgate-1440.png` | `/discover` location gate | 1440 × 900 |
| `audit-locgate-1440-fit.png`, `audit-locgate-1440-scaled.png` | location gate | 1440 × 900 |
| `audit-locgate-suburb-raw-osm-1440.png` | suburb search (OSM call) | 1440 × 900 |
| `audit-discover-1440x900.png`, `audit-discover-1440-full.png` | `/discover` | 1440 × 900 |
| `audit-discover-390.png`, `-scroll1`, `-scroll2` | `/discover` | 390 × 844 |
| `audit-find-1440.png`, `audit-find-1440-fit.png` | `/find` | 1440 × 900 |
| `audit-likes-1440.png` | `/likes` | 1440 × 900 |
| `audit-chats-1440.png` | `/chats` | 1440 × 900 |
| `audit-chats-390.png` | `/chats` | 390 × 844 |
| `audit-notifications-1440.png` | `/notifications` | 1440 × 900 |
| `notifications-390.png` | `/notifications` | 390 × 844 |
| `audit-myprofile-1440.png` | `/profile` | 1440 × 900 |
| `audit-editprofile-1440.png` | `/profile/edit` | 1440 × 900 |
| `audit-settings-1440.png`, `dateza-settings-1440.png` | `/settings` | 1440 × 900 |
| `dateza-settings-390.png`, `dateza-settings-account-390.png` | `/settings` | 390 × 844 |
| `audit-safety-1440.png` | `/settings/safety` | 1440 × 900 |
| `audit-mobilemenu-390.png` | mobile menu drawer | 390 × 844 |

---

## The one-sentence answer to the brief's question

*"If we gave DateZA to 1,000 real users tomorrow, where would the product embarrass us?"*

It would not crash and it would not lie to them — but it would **expose us legally** (no Terms
or POPIA privacy policy), **fail the one member who needs it most** (Report in the Safety
centre goes to an empty Chats page), and **bore the other 999**, because Likes has one working
tab out of four, Discover's filters cannot find anyone new, and Notifications has exactly one
kind of event. The engineering is ready for users. The product is not yet ready to hold them.
