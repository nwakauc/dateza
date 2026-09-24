export type RobotsDirective = "index, follow" | "noindex, nofollow";

export type SchemaType = "WebSite" | "WebPage" | "Article" | "BreadcrumbList" | "FAQPage" | "Organization";

export type SeoBreadcrumb = {
  name: string;
  path: string;
};

export type SeoLink = {
  path: string;
  label: string;
};

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

export type SeoFaq = {
  question: string;
  answer: string;
};

export type SeoPageKind = "home" | "article" | "hub" | "city" | "utility";

export type SeoPage = {
  path: string;
  title: string;
  description: string;
  h1: string;
  eyebrow: string;
  intro: string;
  robots: RobotsDirective;
  sitemap: boolean;
  schemaTypes: SchemaType[];
  kind: SeoPageKind;
  lastModified: string;
  breadcrumbs?: SeoBreadcrumb[];
  related?: SeoLink[];
  image?: { src: string; alt: string };
  faqs?: SeoFaq[];
  blocks: ContentBlock[];
};
