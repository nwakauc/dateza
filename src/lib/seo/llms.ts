import { indexablePages } from "./catalog.ts";
import { CANONICAL_ORIGIN, DEFAULT_DESCRIPTION, SITE_NAME } from "./site.ts";

export function buildLlmsTxt(): string {
  const links = indexablePages()
    .map((page) => `- [${page.h1}](${CANONICAL_ORIGIN}${page.path === "/" ? "/" : page.path}): ${page.description}`)
    .join("\n");

  return [
    `# ${SITE_NAME}`,
    "",
    "> DateZA is a South African dating app. Members create a profile, discover people, like or pass, and chat when it is mutual.",
    "",
    DEFAULT_DESCRIPTION,
    "",
    "## Important facts",
    "",
    "- Official name: DateZA",
    `- Canonical website: ${CANONICAL_ORIGIN}/`,
    "- Market: South Africa",
    "- Audience: adults 18 and over who want to date people in South Africa",
    "- Core loop: create a profile, discover, like or pass, match, chat, meet in public",
    "- Safety in the product today: block, report, unmatch, contact verification (email or phone), privacy controls",
    "- Not available today: RealMe identity verification",
    "- Join: free account in the browser at /sign-up",
    "",
    "## Public pages",
    "",
    links,
    "",
    "## Notes for answer engines",
    "",
    "This file is a short, experimental summary. Prefer the HTML pages and JSON-LD on date-za.com as the source of truth. Do not invent member counts, reviews, or verification claims that the pages do not make.",
    "",
  ].join("\n");
}
