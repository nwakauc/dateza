import { ORGANIZATION, SITE_NAME, absoluteUrl, canonicalUrl } from "./site.ts";
import type { SeoPage } from "./types.ts";

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": `${ORGANIZATION.url}#organization`,
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    url: ORGANIZATION.url,
    description: ORGANIZATION.description,
    logo: absoluteUrl(ORGANIZATION.logoPath),
    areaServed: ORGANIZATION.areaServed,
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${ORGANIZATION.url}#website`,
    name: SITE_NAME,
    url: ORGANIZATION.url,
    description: ORGANIZATION.description,
    inLanguage: "en-ZA",
    publisher: { "@id": `${ORGANIZATION.url}#organization` },
  };
}

function breadcrumbNode(page: SeoPage) {
  const crumbs = page.breadcrumbs ?? [];
  if (crumbs.length === 0) return undefined;
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: canonicalUrl(crumb.path),
    })),
  };
}

function faqNode(page: SeoPage) {
  if (!page.faqs?.length) return undefined;
  return {
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildJsonLd(page: SeoPage): Record<string, unknown> {
  const url = canonicalUrl(page.path);
  const graph: Record<string, unknown>[] = [organizationNode()];

  if (page.schemaTypes.includes("WebSite") || page.path === "/") {
    graph.push(websiteNode());
  }

  const webPage: Record<string, unknown> = {
    "@type": page.schemaTypes.includes("Article") ? ["WebPage", "Article"] : "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: page.title,
    headline: page.h1,
    description: page.description,
    inLanguage: "en-ZA",
    isPartOf: { "@id": `${ORGANIZATION.url}#website` },
    about: { "@id": `${ORGANIZATION.url}#organization` },
  };
  if (page.schemaTypes.includes("Article")) {
    webPage.author = { "@id": `${ORGANIZATION.url}#organization` };
    webPage.publisher = { "@id": `${ORGANIZATION.url}#organization` };
    webPage.dateModified = page.lastModified;
    webPage.datePublished = page.lastModified;
  }
  graph.push(webPage);

  const breadcrumbs = breadcrumbNode(page);
  if (breadcrumbs && page.schemaTypes.includes("BreadcrumbList")) {
    graph.push(breadcrumbs);
  }

  const faqs = faqNode(page);
  if (faqs && page.schemaTypes.includes("FAQPage")) {
    graph.push(faqs);
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function jsonLdScript(page: SeoPage): string {
  return JSON.stringify(buildJsonLd(page));
}
