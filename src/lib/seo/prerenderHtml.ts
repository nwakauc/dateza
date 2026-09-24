import { CITY_CARDS } from "./copy/cities.ts";
import { richTextToHtml } from "./richText.ts";
import type { ContentBlock, SeoPage } from "./types.ts";

function blockHtml(block: ContentBlock): string {
  if (block.type === "p") {
    return `<p>${richTextToHtml(block.text)}</p>`;
  }
  if (block.type === "h2") {
    return `<h2>${richTextToHtml(block.text)}</h2>`;
  }
  const tag = block.type === "ol" ? "ol" : "ul";
  const extra = block.type === "ol" ? " public-article__steps" : " public-article__list";
  const items = block.items
    .map((item) => `<li>${richTextToHtml(item)}</li>`)
    .join("");
  return `<${tag} class="${extra.trim()}">${items}</${tag}>`;
}

function crumbsHtml(page: SeoPage): string {
  if (!page.breadcrumbs?.length) return "";
  const items = page.breadcrumbs
    .map((crumb, index) => {
      const last = index === page.breadcrumbs!.length - 1;
      if (last) {
        return `<li><span aria-current="page">${richTextToHtml(crumb.name)}</span></li>`;
      }
      return `<li><a href="${crumb.path}">${richTextToHtml(crumb.name)}</a></li>`;
    })
    .join("");
  return `<nav class="public-breadcrumbs" aria-label="Breadcrumb"><ol>${items}</ol></nav>`;
}

function relatedHtml(page: SeoPage): string {
  if (!page.related?.length) return "";
  const items = page.related
    .map((link) => `<li><a href="${link.path}">${richTextToHtml(link.label)}</a></li>`)
    .join("");
  return `<section class="public-related" aria-labelledby="public-related-heading"><h2 id="public-related-heading">Keep exploring</h2><ul>${items}</ul></section>`;
}

function faqHtml(page: SeoPage): string {
  if (!page.faqs?.length) return "";
  const items = page.faqs
    .map(
      (faq) =>
        `<div class="public-faq__item"><h2>${richTextToHtml(faq.question)}</h2><p>${richTextToHtml(faq.answer)}</p></div>`,
    )
    .join("");
  return `<section class="public-faq" aria-label="Questions">${items}</section>`;
}

function cityGridHtml(page: SeoPage): string {
  if (page.path !== "/dating") return "";
  const cards = CITY_CARDS.map(
    (city) => `
      <a class="public-mosaic__card public-city-card" href="${city.path}">
        <img class="dz-img" src="${city.image}" alt="${city.name}, ${city.province}" width="640" height="360" />
        <span class="public-city-card__copy">
          <strong>${city.name}</strong>
          <small>${city.blurb}</small>
        </span>
      </a>`,
  ).join("");
  return `<div class="public-mosaic public-mosaic--cities public-city-grid">${cards}</div>`;
}

function lifestyleMosaicHtml(page: SeoPage): string {
  if (page.path !== "/lifestyle") return "";
  const tiles = [
    ["/images/lifestyle/city-nights.webp", "City nights"],
    ["/images/lifestyle/beach-days.webp", "Beach days"],
    ["/images/lifestyle/road-trips.webp", "Road trips"],
    ["/images/lifestyle/good-food.webp", "Good food"],
    ["/images/lifestyle/live-events.webp", "Live events"],
  ];
  const cards = tiles
    .map(
      ([src, label]) =>
        `<figure class="public-mosaic__card"><img class="dz-img" src="${src}" alt="${label} in South Africa" width="640" height="360" /><figcaption>${label}</figcaption></figure>`,
    )
    .join("");
  return `<div class="public-mosaic">${cards}</div>`;
}

function imageHtml(page: SeoPage): string {
  if (!page.image) return "";
  return `<figure class="public-article__figure"><img class="dz-img public-article__hero" src="${page.image.src}" alt="${page.image.alt}" width="960" height="540" /></figure>`;
}

export function prerenderArticleBody(page: SeoPage): string {
  const blocks = page.blocks.map(blockHtml).join("");
  return `
    <main class="public-article" id="main-content">
      ${crumbsHtml(page)}
      <p class="public-article__eyebrow">${page.eyebrow}</p>
      <h1 class="public-article__title">${page.h1}</h1>
      <p class="public-article__intro">${page.intro}</p>
      ${imageHtml(page)}
      ${blocks}
      ${cityGridHtml(page)}
      ${lifestyleMosaicHtml(page)}
      ${faqHtml(page)}
      ${relatedHtml(page)}
      <p class="public-article__cta-row">
        <a class="public-article__cta" href="/sign-up">Join DateZA free</a>
      </p>
    </main>`;
}

export function prerenderPublicChrome(inner: string): string {
  return `
<div class="dz-page public-site">
  <a class="public-skip-link" href="#main-content">Skip to content</a>
  <header class="dz-nav public-chrome__nav">
    <a class="dz-logo public-chrome__logo dateza-brand-link" href="/" aria-label="DateZA home">
      <span class="public-chrome__wordmark">DateZA</span>
      <span class="public-chrome__tag">NO DNA. JUST RSA. 🇿🇦</span>
    </a>
    <nav class="dz-nav-links public-chrome__links" aria-label="DateZA">
      <a href="/south-african-dating">South African dating</a>
      <a href="/how-it-works">How it works</a>
      <a href="/dating-safely">Safety</a>
      <a href="/dating-advice">Dating advice</a>
      <a href="/sign-in">Sign in</a>
      <a class="dz-nav-join" href="/sign-up">Join free</a>
    </nav>
  </header>
  ${inner}
  <footer class="dz-footer public-chrome__footer">
    <a class="public-chrome__foot-brand" href="/"><b>DateZA</b> · NO DNA. JUST RSA. 🇿🇦</a>
    <div class="public-chrome__foot-links">
      <a href="/south-african-dating">South African dating</a>
      <a href="/singles">Singles</a>
      <a href="/dating">Cities</a>
      <a href="/dating-advice">Advice</a>
      <a href="/dating-safely">Safety</a>
      <a href="/about">About</a>
      <a href="/privacy">Privacy</a>
      <a href="/help">Help Centre</a>
    </div>
    <span>© 2026 DateZA. All rights reserved.</span>
  </footer>
</div>`;
}

export function prerenderPublicPage(page: SeoPage): string {
  return prerenderPublicChrome(prerenderArticleBody(page));
}
