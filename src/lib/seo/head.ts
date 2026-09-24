import { jsonLdScript } from "./schema.ts";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl, canonicalUrl } from "./site.ts";
import type { SeoPage } from "./types.ts";

export type HeadTags = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  ogType: "website" | "article";
  twitterCard: "summary_large_image";
  jsonLd: string;
};

export function buildHeadTags(page: SeoPage): HeadTags {
  const canonical = canonicalUrl(page.path);
  const image = absoluteUrl(page.image?.src ?? DEFAULT_OG_IMAGE_PATH);
  return {
    title: page.title,
    description: page.description,
    canonical,
    robots: page.robots,
    ogTitle: page.title,
    ogDescription: page.description,
    ogUrl: canonical,
    ogImage: image,
    ogType: page.kind === "article" ? "article" : "website",
    twitterCard: "summary_large_image",
    jsonLd: jsonLdScript(page),
  };
}

