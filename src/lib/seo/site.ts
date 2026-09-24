/** Production origin for canonical URLs, sitemap, robots, and social tags. */
export const CANONICAL_ORIGIN = "https://date-za.com";

export const SITE_NAME = "DateZA";

export const DEFAULT_TITLE = "DateZA — Dating in South Africa";

export const DEFAULT_DESCRIPTION =
  "DateZA is a South African dating app. Join free, create a profile, and meet singles across the country — from Cape Town and Johannesburg to Durban and beyond.";

export const DEFAULT_OG_IMAGE_PATH = "/og-image.svg";

export const SEO_RELEASE_DATE = "2026-09-24";

export const ORGANIZATION = {
  name: SITE_NAME,
  legalName: "DateZA",
  url: `${CANONICAL_ORIGIN}/`,
  description: DEFAULT_DESCRIPTION,
  logoPath: "/favicon.svg",
  sameAs: [] as const,
  areaServed: "South Africa",
};

export function canonicalUrl(path: string): string {
  if (path === "/") return `${CANONICAL_ORIGIN}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${CANONICAL_ORIGIN}${normalized.replace(/\/+$/, "")}`;
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${CANONICAL_ORIGIN}${normalized}`;
}

export const PRIVATE_PATH_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/home",
  "/signed-in",
  "/discover",
  "/discovery",
  "/find",
  "/likes",
  "/chats",
  "/notifications",
  "/profile",
  "/settings",
  "/safety",
  "/hq",
  "/ops",
] as const;

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
