# HQ cross-brand admin app — investigation and recommendation

**Update (same day): founder approved Option B.** Extraction has started at `~/pro/d8n-hq` (new
repo). It builds, lints, and passes its full test suite (61/61, ported + adapted from this
repo's HQ suite) locally, and is NOT deployed anywhere yet — no domain, no DNS, no production
CORS entry added. See `~/pro/d8n-hq/HQ-EXTRACTION-PLAN.md` for exactly what moved, what was
rewritten (multi-brand Bearer-token session model), and what's left before a real deploy.

Status below is the original investigation writeup, left as-is for the record.

~~Status: **investigation complete, recommendation unconfirmed by founder** (could not reach
them synchronously in this session). No structural move (repo extraction, new deploy target,
new domain) has been made. One small, safe, additive frontend change was made in this repo (see
"What I changed" at the bottom) — reversible, tested, no backend dependency.~~

Scope note: this doc lives in `~/pro/dateza` because `~/pro/d8n` is off-limits (another session
is running a live production migration there). Every backend claim below is read-only research
against that repo; no file in `~/pro/d8n` was edited.

## The ask

Founder wants one login, one admin/moderation UI, usable across HookUs, DateZA, and Date9ja,
without rebuilding the UI per brand. Deferred until "everything is stable" — now unblocked enough
to start.

## What exists today

**Backend (`~/pro/d8n`, read-only reference):**
- `domains/hq/*` — real HQ services (command centre, member 360, trust & safety, analytics,
  product intelligence, security events, sensitive-read audit).
- `app/controllers/api/v1/hq/*` — controllers exposing those as `/api/v1/hq/*`.
- Admin identity: `AdminUser belongs_to :user` (one User), `has_many :admin_assignments` →
  `AdminAssignment belongs_to :brand, :admin_role` — **one AdminUser can hold active assignments
  on multiple brands simultaneously.** Confirmed in `domains/admin/founder_bootstrap.rb`, which
  explicitly creates one `User`/`AdminUser` and loops `active_brands.map { assign!(...) }` to
  grant assignments across every brand. So the "one admin identity, many brands" data model
  **already exists** — this is not a gap.

**Frontend (`~/pro/dateza`, this repo):**
- `src/features/hq/` — a substantial, working HQ UI (Command Centre, Member 360, Member Search,
  Trust & Safety, Alerts, Report Detail, MFA gate, and a `founder/` subfolder with a
  cross-brand-styled dashboard: `FounderOverview`, `FounderBrandComparison`,
  `FounderCompanyPulse`, `FounderTrustSafety`, `FounderSecurityAlerts`, etc.)
- `src/lib/hq/api.ts` — API client; its own comment says "Brand is host-derived by D8N; never send
  a client brand parameter."
- Mounted at `/hq` inside the DateZA app's router (`src/app/AppRoutes.tsx`), gated by
  `HqProtectedRoute` + `HqMfaGate`. **This route only exists in the DateZA repo.** I checked
  `~/pro/hookus` and `~/pro/Date9ja` — neither has any `hq`/admin feature module at all. So today,
  HQ is reachable *only* by visiting wherever the DateZA React app is deployed. A founder wanting
  HookUs or Date9ja admin data has no UI for it at all right now, regardless of the cross-brand
  question below.

## The core question: does the existing "cross-brand" UI actually work cross-brand today?

**Short answer: almost none of it does. Only one endpoint (brand health comparison) is genuinely
cross-brand. Everything else is silently locked to whichever single brand's hostname served the
request — and the code already knows and documents this as a "Phase 1" limitation.**

Evidence, traced end to end:

1. **Brand resolution is 100% Host-header-derived, with no override.**
   `domains/brands/resolver.rb`:
   ```ruby
   def call
     host = normalized_host(request.host)
     domain = BrandDomain.kept.active.joins(:brand).merge(Brand.kept.active).includes(:brand).find_by(host:)
     Result.new(brand: domain&.brand, source: domain ? :host : nil)
   end
   ```
   `ApplicationController#set_current_context` sets `Current.brand = result.brand` on every
   request. There is no query param, header, or admin override path.

2. **Every HQ controller except one uses `Current.brand` to scope its data**, e.g.
   `command_centre_controller.rb#health` → `BrandHealthSnapshot.call(brand: Current.brand)`,
   `members_controller.rb`, `trust_safety_controller.rb`, `analytics_controller.rb`,
   `security_alerts_controller.rb`, `operators_controller.rb`, `product_intelligence_controller.rb`
   — all pass `brand: Current.brand`. I grepped every file in
   `app/controllers/api/v1/hq/*.rb` for this; it's consistent across the board.

3. **The one exception is `command_centre_controller.rb#brands`**, which calls
   `Hq::CommandCentre::BrandComparison.call(admin_user: Current.admin_user)`. That service
   (`domains/hq/command_centre/brand_comparison.rb`) ignores `Current.brand` entirely and loops
   over *every* `AdminAssignment` the admin_user holds, querying `BrandHealthSnapshot` per brand
   directly against the DB — all brands live in the same Rails process/DB, so this cross-brand
   aggregation needs no network hop and no host switch. This is the only truly cross-brand read
   in the whole system today, and it powers `FounderBrandComparison.tsx` in this repo (verified
   it consumes `HqCommandCentreBrandsResponse`, the parsed shape of that endpoint).

4. **The session itself is pinned to one brand at issuance, not just the request.**
   `app/models/session.rb`: `Session belongs_to :brand`. `Identity::SessionAuthenticator`:
   ```ruby
   return Result.new(false, nil, nil, :wrong_brand) if session.brand_id != brand.id
   ```
   A token issued when an admin logs in via DateZA's host is **rejected outright** (not just
   data-scoped — a hard `wrong_brand` auth failure) if presented against a request whose Host
   resolves to a different brand. So even though the underlying `AdminUser`/`User` is the same
   person across brands, one login does not yield one usable credential across brands today.

5. **The frontend already knows this and has a "Phase 1" disclaimer baked in**, which I found
   *before* making any change — this isn't a hidden bug, it's a labeled, intentional boundary
   nobody has revisited:
   `src/features/hq/HqHeader.tsx` (`BrandSelector`, before my edit):
   ```
   title="Brand is resolved from the API host. Cross-brand All Company is not available in Phase 1."
   ```
   and the global search palette hint:
   ```
   Exact identifier lookup on this brand only. Unknown and cross-brand identifiers both look
   like "not found" — that is intentional.
   ```
   Also: `/api/v1/hq/operator` (`operator_controller.rb#show`) already returns the admin's full
   `brand_assignments` list (every brand they're an active admin on) — but until my change today,
   the frontend fetched and typed this (`HqCurrentOperator.brand_assignments`) and **never
   displayed it anywhere** except a test fixture. Confirmed with
   `grep -rn "brand_assignments" src` before editing.

**Conclusion on the core question:** the backend's admin-identity model is genuinely cross-brand
(one AdminUser, many AdminAssignments), and one specific read (`/hq/command_centre/brands`) proves
it end-to-end. But the request/session/authorization plumbing for every other HQ endpoint is
hard-locked to a single brand determined purely by which hostname served the HTTP request, and the
session token itself won't even authenticate against a different brand's host. The "founder"
dashboard's cross-brand appearance is real for the top-of-page brand comparison tiles and
misleading for everything else (Member 360, Trust & Safety, Alerts, Analytics, Operators) — those
silently show only the one brand whose domain happens to be serving the page, with no indication
in the UI (until today) that other brands even exist.

## Why extraction alone (Option B naively) would NOT fix this

Moving `src/features/hq` + `src/lib/hq` to a new repo/domain does nothing by itself: the backend
would still resolve `Current.brand` from whatever host receives the request, and a session is
still pinned to one brand at login. A standalone app on `hq.d8n.tech` would face the exact same
wall the DateZA-hosted version does today, unless paired with one of:

- **(a) Backend change** (out of scope for me — flag for the other session/founder): teach the
  single-brand HQ controllers to accept an explicit, server-validated brand selector (checked
  against the caller's `AdminAssignment`s via `Admin::AuthorizationContext`) instead of trusting
  `Current.brand` unconditionally. `BrandComparison` already proves this pattern works — it's a
  matter of extending it to the other controllers/`base_controller.rb`. This is the architecturally
  clean long-term fix, but it's real Rails work I'm not going to attempt against a repo with a live
  production migration in flight.
- **(b) Frontend-only workaround, no backend change needed:** since the D8N frontend already
  supports a Bearer-token auth mode with zero cookie dependency (`src/lib/api/tokenStore.ts`: "D8N
  issues Bearer sessions... not cookies", in-memory only per ADR-0002) and CORS is already
  origin-allowlist-driven via an env var (`config/initializers/cors.rb` reads
  `D8N_CORS_ORIGINS`), a standalone HQ app could hold **one Bearer token per brand** (sign in once
  per brand the first time, cache each brand's 30-day token in memory), and issue each
  single-brand request to *that brand's own hostname* with *that brand's own token* — e.g.
  `GET https://dateza.co.za/api/v1/hq/trust-safety/overview` with the DateZA token,
  `GET https://date9ja.ng/api/v1/hq/trust-safety/overview` with the Date9ja token — merging
  results client-side. The one cross-brand endpoint (`/hq/command_centre/brands`) only ever needs
  one (any) of those tokens, since it aggregates server-side already. This needs: an ops-level
  CORS origin addition (env var, no code change) for whatever domain the standalone app lives on,
  and a real networking-model change in the client (absolute per-brand URLs + a multi-token
  session manager instead of today's single relative-path/same-origin `fetch`).

Path (b) is buildable entirely on the frontend, without waiting on the other session, and without
weakening any auth/capability check — it just calls the *existing* per-brand login and HQ
endpoints, once per brand, the same way a human clicking between three browser tabs would. Path
(a) is cleaner (one login, true single session) but is backend work I can't do right now.

## Recommendation: Option B, gated on founder confirmation, sequenced after (b) is feasible

1. Extract `src/features/hq/` + `src/lib/hq/` into a standalone app (own repo or own package in a
   monorepo — either works), deployed at its own domain (e.g. `hq.d8n.tech`), talking to the same
   Rails backend the three brand frontends already use.
2. Reason it beats Option A (stay inside DateZA): the multi-token, absolute-URL, per-brand-fanout
   networking model in (b) is a fundamentally different request pattern than DateZA's own
   same-origin relative-fetch app was built for, and bolting it onto one brand's consumer app is
   itself an instance of the "rebuild it per brand" problem the founder is trying to escape — plus
   HookUs and Date9ja would still have zero path to *their own* HQ view unless they too embedded
   DateZA's feature module (duplicating it, not reusing it) or everyone agreed to funnel through
   DateZA's domain specifically as the de facto admin portal (a strange, brand-confusing choice
   for what's meant to be a neutral operator tool).
3. Ask backend (the other session, once its production migration is done, or the founder) to
   evaluate path (a) as a follow-up — it would let the standalone app do a single login instead of
   one login per brand, which is a materially nicer operator experience. Not a blocker to starting
   extraction with (b).
4. Do NOT touch DNS, do NOT deploy, until the founder has actually seen and confirmed this
   direction — this is exactly the kind of "real architecture decision they explicitly wanted to
   make" the task called out.

## What I changed (small, safe, no backend dependency, done today)

`src/features/hq/HqHeader.tsx` — `BrandSelector` now surfaces the operator's full
`brand_assignments` list (already fetched by `/api/v1/hq/operator`, previously parsed but never
rendered anywhere). It does **not** add switching — that's not possible without either backend
change (a) or the multi-token client (b) above — it only makes the existing single-brand
limitation honest and visible: an admin with access to multiple brands now sees "+N more" and,
on hover, which other brands they administer, instead of a silent, unlabeled single-brand view.
Verified: `npx tsc --noEmit` clean, and the full HQ test suite
(`hq.test.tsx`, `trustSafety.test.tsx`, `hqNav.test.ts`, `hqModePreference.test.ts` — 55 tests)
passes unchanged.

## Open items for the founder / other session

- Confirm Option B (standalone app + domain) vs. staying inside DateZA a while longer.
- If Option B: pick the domain/deploy target (`hq.d8n.tech`? a Vercel project alongside the
  existing three?) and whether this becomes a new git repo or a package in an existing one.
- Decide whether to pursue backend path (a) (single cross-brand session) as a follow-up — real
  Rails work, none of it started, fully scoped above (`base_controller.rb` brand-selector +
  `Admin::AuthorizationContext` reuse pattern already proven by `BrandComparison`).
- CORS origin allowlist (`D8N_CORS_ORIGINS`) needs the new HQ domain added once one exists — ops
  config only, no code change, but still a production touch that needs explicit sign-off.
