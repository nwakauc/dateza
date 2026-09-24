import { adviceHubPage, aboutPage, datingHubPage, singlesPage, southAfricanDatingPage } from "./copy/hubs.ts";
import { cityPages } from "./copy/cities.ts";
import { advicePages } from "./copy/advice.ts";
import {
  careersPage,
  datingSafelyPage,
  getTheAppPage,
  helpPage,
  homePage,
  howItWorksPage,
  lifestylePage,
  privacyPage,
  storiesPage,
} from "./copy/existing.ts";
import { canonicalUrl } from "./site.ts";
import type { SeoPage } from "./types.ts";

export const SEO_PAGES: SeoPage[] = [
  homePage,
  southAfricanDatingPage,
  singlesPage,
  datingHubPage,
  ...cityPages,
  howItWorksPage,
  datingSafelyPage,
  aboutPage,
  adviceHubPage,
  ...advicePages,
  privacyPage,
  helpPage,
  storiesPage,
  lifestylePage,
  careersPage,
  getTheAppPage,
];

const pagesByPath = new Map(SEO_PAGES.map((page) => [page.path, page]));

export function getSeoPage(path: string): SeoPage | undefined {
  const normalized = path === "" ? "/" : path.replace(/\/+$/, "") || "/";
  return pagesByPath.get(normalized);
}

export function indexablePages(): SeoPage[] {
  return SEO_PAGES.filter((page) => page.robots === "index, follow" && page.sitemap);
}

export function sitemapPaths(): string[] {
  return indexablePages().map((page) => page.path);
}

export function allCanonicalUrls(): string[] {
  return SEO_PAGES.map((page) => canonicalUrl(page.path));
}

export function catalogPaths(): string[] {
  return SEO_PAGES.map((page) => page.path);
}
