import { describe, expect, it } from "vitest";
import { SEO_PAGES, getSeoPage, indexablePages, sitemapPaths } from "./catalog.ts";
import { buildJsonLd, jsonLdScript } from "./schema.ts";
import { buildHeadTags } from "./head.ts";
import { buildLlmsTxt } from "./llms.ts";
import { buildRobotsTxt } from "./robots.ts";
import { injectSeoHead } from "./injectHtml.ts";
import { buildSitemapXml } from "./sitemap.ts";
import { CANONICAL_ORIGIN, PRIVATE_PATH_PREFIXES, canonicalUrl, isPrivatePath } from "./site.ts";

describe("SEO catalog", () => {
  it("uses unique paths and unique production canonicals", () => {
    const paths = SEO_PAGES.map((page) => page.path);
    const canonicals = SEO_PAGES.map((page) => canonicalUrl(page.path));
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(canonicals).size).toBe(canonicals.length);
    expect(canonicals.every((url) => url.startsWith(`${CANONICAL_ORIGIN}/`) || url === `${CANONICAL_ORIGIN}/`)).toBe(
      true,
    );
    expect(canonicals.some((url) => url.includes("localhost") || url.includes("vercel.app"))).toBe(false);
  });

  it("keeps public SEO pages indexable and private prefixes out of the sitemap", () => {
    const publicIndexable = indexablePages();
    expect(publicIndexable.length).toBeGreaterThanOrEqual(20);
    expect(publicIndexable.every((page) => page.robots === "index, follow")).toBe(true);
    expect(sitemapPaths()).toEqual([...new Set(sitemapPaths())]);
    expect(sitemapPaths().some((path) => isPrivatePath(path))).toBe(false);
    expect(getSeoPage("/careers")?.robots).toBe("noindex, nofollow");
    expect(getSeoPage("/get-the-app")?.sitemap).toBe(false);
    expect(getSeoPage("/")?.robots).toBe("index, follow");
    expect(getSeoPage("/dating/cape-town")?.sitemap).toBe(true);
  });

  it("does not canonicalize public safety to the authenticated /safety route", () => {
    expect(getSeoPage("/dating-safely")?.path).toBe("/dating-safely");
    expect(getSeoPage("/safety")).toBeUndefined();
    expect(isPrivatePath("/safety")).toBe(true);
  });
});

describe("robots.txt", () => {
  it("allows public pages and points at the production sitemap", () => {
    const robots = buildRobotsTxt();
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`);
    expect(robots).not.toContain("Disallow: /\n");
    for (const prefix of PRIVATE_PATH_PREFIXES) {
      expect(robots).toContain(`Disallow: ${prefix}`);
    }
  });
});

describe("sitemap.xml", () => {
  it("lists each indexable production URL once", () => {
    const xml = buildSitemapXml();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    expect(locs.length).toBe(indexablePages().length);
    expect(new Set(locs).size).toBe(locs.length);
    expect(locs.every((loc) => loc.startsWith(CANONICAL_ORIGIN))).toBe(true);
    expect(locs).toContain(`${CANONICAL_ORIGIN}/`);
    expect(locs).toContain(`${CANONICAL_ORIGIN}/dating/cape-town`);
    expect(locs).not.toContain(`${CANONICAL_ORIGIN}/sign-in`);
    expect(locs).not.toContain(`${CANONICAL_ORIGIN}/discover`);
    expect(locs).not.toContain(`${CANONICAL_ORIGIN}/careers`);
    expect(xml).toContain("<lastmod>2026-09-24</lastmod>");
    expect(xml).not.toContain("localhost");
  });
});

describe("JSON-LD and metadata", () => {
  it("emits parseable schema for homepage, article, and city pages", () => {
    const home = getSeoPage("/");
    const article = getSeoPage("/dating-advice/first-date-safety");
    const city = getSeoPage("/dating/johannesburg");
    expect(home && article && city).toBeTruthy();
    if (!home || !article || !city) return;

    const homeGraph = buildJsonLd(home);
    expect(JSON.parse(jsonLdScript(home))).toEqual(homeGraph);
    expect(JSON.stringify(homeGraph)).toContain("Organization");
    expect(JSON.stringify(homeGraph)).toContain("WebSite");

    const articleGraph = JSON.parse(jsonLdScript(article)) as { "@graph": Array<{ "@type": unknown }> };
    expect(JSON.stringify(articleGraph)).toContain("Article");
    expect(JSON.stringify(articleGraph)).toContain("BreadcrumbList");

    const cityHead = buildHeadTags(city);
    expect(cityHead.canonical).toBe(`${CANONICAL_ORIGIN}/dating/johannesburg`);
    expect(cityHead.robots).toBe("index, follow");
    expect(cityHead.ogImage.startsWith(CANONICAL_ORIGIN)).toBe(true);
    expect(cityHead.jsonLd).not.toContain("AggregateRating");
    expect(cityHead.jsonLd).not.toContain('"@type":"Review"');
  });

  it("rewrites homepage social tags to the page being prerendered", () => {
    const city = getSeoPage("/dating/cape-town");
    expect(city).toBeTruthy();
    if (!city) return;
    const html = `<!doctype html><html><head>
      <title>DateZA — Dating in South Africa</title>
      <meta name="description" content="Homepage" />
      <link rel="canonical" href="https://date-za.com/" />
      <meta property="og:title" content="DateZA — Dating in South Africa" />
    </head><body><div id="root"></div></body></html>`;
    const next = injectSeoHead(html, city);
    expect(next).toContain("<title>Dating in Cape Town | DateZA</title>");
    expect(next).toContain('rel="canonical" href="https://date-za.com/dating/cape-town"');
    expect(next).toContain('property="og:title" content="Dating in Cape Town | DateZA"');
    expect(next).not.toContain('property="og:title" content="DateZA — Dating in South Africa"');
    expect(next).toContain("application/ld+json");
    expect(() => JSON.parse(next.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "")).not.toThrow();
  });

  it("keeps llms.txt supplementary and fact-bound", () => {
    const llms = buildLlmsTxt();
    expect(llms).toContain("# DateZA");
    expect(llms).toContain(CANONICAL_ORIGIN);
    expect(llms).toContain("RealMe identity verification");
    expect(llms).not.toContain("guaranteed");
    expect(llms).not.toContain("10 million");
  });
});
