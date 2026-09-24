import { indexablePages } from "./catalog.ts";
import { canonicalUrl } from "./site.ts";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemapXml(): string {
  const urls = indexablePages().map((page) => {
    const loc = xmlEscape(canonicalUrl(page.path));
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${page.lastModified}</lastmod>\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
