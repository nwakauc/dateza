# ADR-0005: Public SEO acquisition surface on the Vite SPA

**Status:** Accepted
**Date:** 2026-09-24
**Owners:** DateZA frontend
**Supersedes:** None

## Context

DateZA is a Vite + React Router client (ADR-0001). Production is
`https://date-za.com`. Search Console needs a sitemap and robots.txt. The
authenticated product must not become search-result clutter, and public pages
must not invent RealMe, reviews, or member counts.

A meta-framework migration is out of scope. The landing page remains the
approved `landingMarkup.ts` port.

## Decision

- Treat `https://date-za.com` as the only canonical origin. Never derive
  canonicals from `window.location`, preview hosts, or API hosts.
- Keep a typed public catalog (`src/lib/seo`) as the source of truth for
  titles, descriptions, robots, sitemap inclusion, and JSON-LD.
- Emit `robots.txt`, `sitemap.xml`, and experimental `llms.txt` at build time.
- Prerender public *subpages* as static HTML files so crawlers receive text
  without executing JavaScript. Keep `dist/index.html` as the SPA shell so
  auth and app fallbacks do not flash marketing HTML.
- Public safety lives at `/dating-safely`. Do not reuse `/safety`, which is an
  authenticated shortcut to `/settings/safety`.
- `/cities` permanently redirects to `/dating`.
- Private, HQ, ops, auth, careers, and get-the-app URLs are `noindex`.
- Structured data is limited to Organization, WebSite, WebPage, Article,
  BreadcrumbList, and FAQPage when the page actually contains that content.

## Alternatives considered

- **Next.js / Vike SSR:** larger rewrite than this ticket; conflicts with
  ADR-0001.
- **Helmet-only client metadata:** enough for users after hydration, not for
  social unfurlers or non-JS crawlers on inner pages.
- **Injecting the landing page into the shared `index.html` root:** would
  prerender `/` well, but the same file is the SPA fallback for `/sign-in`
  and unknown routes.

## Consequences

- New public IA can grow from the catalog without touching product screens.
- Vercel must continue to serve existing files before the SPA rewrite.
- `llms.txt` is supplementary. It does not replace HTML, sitemap, or schema.

## Security and privacy

Public pages contain no member data, precise location, report reasons, or
credentials. Sitemap excludes authenticated and API routes.

## Reversal and migration

Remove `src/lib/seo`, the Vite SEO plugin, public SEO routes, and the Vercel
headers/redirects added for this work. Restore `MarketingPages.tsx` from git
if the richer catalog pages are dropped.
