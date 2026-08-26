# DateZA Frontend Security and Privacy

**Status:** Required review baseline  
**Last reviewed:** 2026-08-26

Dating software handles identity, relationship preferences, location, media,
messages, and safety actions. Treat all member data as sensitive even when a
field may eventually be public on a profile.

## Data classes

| Class | Examples | Frontend rule |
| --- | --- | --- |
| Secret | session credentials, provider keys | Never log, persist casually, expose in URLs, or bundle |
| Highly sensitive | precise location, ID/selfie evidence, raw risk signals, messages | Use only on approved surfaces; minimize lifetime; never send to analytics |
| Member-private | preferences, reports, blocks, hidden profile state | Display only to the authorized member; use neutral errors |
| Profile-public | approved display name, age, approximate place, approved photos | Render only the server-approved public representation |
| Operational | request IDs, bounded error codes, performance timings | Log without member content or stable tracking where avoidable |

## Every feature review asks

- Who can invoke this action and who owns the resource?
- Can another account enumerate an ID or infer hidden state?
- What changes when either participant blocks, is suspended, closes an account,
  or loses access?
- Can the action be replayed, raced, automated, or spammed?
- Does client optimism briefly reveal or permit something the server denied?
- Could a URL, log, analytics event, crash report, screenshot, cache, or browser
  storage expose sensitive content?
- Are uploads constrained by type, size, lifecycle, metadata stripping,
  moderation state, and revocation at the D8N boundary?
- Is the wording precise about what was verified and what remains unknown?

## Frontend controls

- Rely on D8N for authorization and enforcement; disabled buttons are UX, not
  security controls.
- Escape ordinary content through React. Never interpolate member/API content
  into raw HTML or execute server-provided markup.
- Prefer secure, same-site, HTTP-only credential mechanisms defined by the auth
  architecture. Any browser-readable long-lived token storage requires an ADR
  and threat review.
- Keep browser API traffic on same-origin `/api/*` gateways (ADR-0003). The
  upstream session cookie must be host-only; never rewrite it onto a shared D8N
  parent domain.
- Do not put credentials, exact coordinates, message text, report content, or
  private IDs in URLs, telemetry, logs, or error reporting.
- Use neutral unavailable responses when specificity could reveal a block,
  suspension, hidden profile, or moderation decision.
- Block/report/account-closure UI must be accessible and must reflect server
  completion, not just local removal.
- Do not add third-party analytics, session replay, chat, ad, identity, payment,
  or upload SDKs without data-flow review, retention terms, consent/legal input,
  and a documented owner.

## Incident rule

If a change may expose secrets or member data, stop further distribution,
preserve useful non-sensitive evidence, notify the responsible human, and do
not paste the sensitive value into tickets or chat. Rotation, revocation,
member/legal notification, and production access are human-owned actions.

