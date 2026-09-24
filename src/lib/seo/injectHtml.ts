import { buildHeadTags } from "./head.ts";
import type { SeoPage } from "./types.ts";

function replaceOrInsert(html: string, pattern: RegExp, replacement: string, insertBefore: string): string {
  if (pattern.test(html)) {
    return html.replace(pattern, replacement);
  }
  return html.replace(insertBefore, `${replacement}\n    ${insertBefore}`);
}

export function injectSeoHead(html: string, page: SeoPage): string {
  const tags = buildHeadTags(page);
  let next = html.replace(/<title>[^<]*<\/title>/, `<title>${tags.title}</title>`);
  next = replaceOrInsert(
    next,
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeAttr(tags.description)}" />`,
    "</head>",
  );
  next = replaceOrInsert(
    next,
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${tags.canonical}" />`,
    "</head>",
  );
  next = replaceOrInsert(
    next,
    /<meta name="robots" content="[^"]*"\s*\/?>/,
    `<meta name="robots" content="${tags.robots}" />`,
    "</head>",
  );

  next = next
    .replace(/\s*<meta property="og:[^"]*" content="[^"]*"\s*\/?>/g, "")
    .replace(/\s*<meta name="twitter:[^"]*" content="[^"]*"\s*\/?>/g, "")
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");

  const social = [
    `<meta property="og:type" content="${tags.ogType}" />`,
    `<meta property="og:site_name" content="DateZA" />`,
    `<meta property="og:locale" content="en_ZA" />`,
    `<meta property="og:title" content="${escapeAttr(tags.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeAttr(tags.ogDescription)}" />`,
    `<meta property="og:url" content="${tags.ogUrl}" />`,
    `<meta property="og:image" content="${tags.ogImage}" />`,
    `<meta name="twitter:card" content="${tags.twitterCard}" />`,
    `<meta name="twitter:title" content="${escapeAttr(tags.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(tags.ogDescription)}" />`,
    `<meta name="twitter:image" content="${tags.ogImage}" />`,
    `<script type="application/ld+json">${tags.jsonLd}</script>`,
  ].join("\n    ");

  return next.replace("</head>", `    ${social}\n  </head>`);
}

export function injectRoot(html: string, body: string): string {
  return html.replace(/<div id="root"><\/div>/, `<div id="root">${body}</div>`);
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
