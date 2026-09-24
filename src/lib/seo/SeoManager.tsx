import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSeoPage } from "./catalog.ts";
import { buildHeadTags } from "./head.ts";
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE_PATH, DEFAULT_TITLE, SITE_NAME, absoluteUrl, canonicalUrl } from "./site.ts";

function upsertMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  const head = document.head;
  let element = head.querySelector<HTMLMetaElement>(`${selector}`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  const head = document.head;
  let element = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    head.appendChild(element);
  }
  element.href = href;
}

function upsertJsonLd(json: string | undefined) {
  const head = document.head;
  const existing = head.querySelectorAll('script[data-seo-jsonld="true"]');
  existing.forEach((node) => node.remove());
  if (!json) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.seoJsonld = "true";
  script.textContent = json;
  head.appendChild(script);
}

export function SeoManager() {
  const { pathname } = useLocation();
  const page = getSeoPage(pathname);

  useEffect(() => {
    if (page) {
      const tags = buildHeadTags(page);
      document.title = tags.title;
      upsertMeta('meta[name="description"]', "name", "description", tags.description);
      upsertMeta('meta[name="robots"]', "name", "robots", tags.robots);
      upsertLink("canonical", tags.canonical);
      upsertMeta('meta[property="og:type"]', "property", "og:type", tags.ogType);
      upsertMeta('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);
      upsertMeta('meta[property="og:locale"]', "property", "og:locale", "en_ZA");
      upsertMeta('meta[property="og:title"]', "property", "og:title", tags.ogTitle);
      upsertMeta('meta[property="og:description"]', "property", "og:description", tags.ogDescription);
      upsertMeta('meta[property="og:url"]', "property", "og:url", tags.ogUrl);
      upsertMeta('meta[property="og:image"]', "property", "og:image", tags.ogImage);
      upsertMeta('meta[name="twitter:card"]', "name", "twitter:card", tags.twitterCard);
      upsertMeta('meta[name="twitter:title"]', "name", "twitter:title", tags.ogTitle);
      upsertMeta('meta[name="twitter:description"]', "name", "twitter:description", tags.ogDescription);
      upsertMeta('meta[name="twitter:image"]', "name", "twitter:image", tags.ogImage);
      upsertJsonLd(tags.jsonLd);
      return;
    }

    upsertMeta('meta[name="robots"]', "name", "robots", "noindex, nofollow");
    upsertLink("canonical", canonicalUrl(pathname));
    upsertMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl(pathname));
    upsertMeta('meta[property="og:image"]', "property", "og:image", absoluteUrl(DEFAULT_OG_IMAGE_PATH));
    upsertMeta('meta[name="description"]', "name", "description", DEFAULT_DESCRIPTION);
    upsertJsonLd(undefined);
    if (!document.title) {
      document.title = DEFAULT_TITLE;
    }
  }, [page, pathname]);

  return null;
}
