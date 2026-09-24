import { Link } from "react-router-dom";
import { CITY_CARDS } from "../../lib/seo/copy/cities.ts";
import { RichText } from "../../lib/seo/RichText.tsx";
import type { ContentBlock, SeoPage } from "../../lib/seo/types.ts";
import { PublicChrome } from "./PublicChrome.tsx";

function BlockView({ block }: { block: ContentBlock }) {
  if (block.type === "p") {
    return (
      <p>
        <RichText text={block.text} />
      </p>
    );
  }
  if (block.type === "h2") {
    return (
      <h2>
        <RichText text={block.text} />
      </h2>
    );
  }
  const Tag = block.type === "ol" ? "ol" : "ul";
  const className = block.type === "ol" ? "public-article__steps" : "public-article__list";
  return (
    <Tag className={className}>
      {block.items.map((item) => (
        <li key={item}>
          <RichText text={item} />
        </li>
      ))}
    </Tag>
  );
}

function Breadcrumbs({ page }: { page: SeoPage }) {
  if (!page.breadcrumbs?.length) return null;
  return (
    <nav className="public-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {page.breadcrumbs.map((crumb, index) => {
          const last = index === page.breadcrumbs!.length - 1;
          return (
            <li key={crumb.path}>
              {last ? (
                <span aria-current="page">{crumb.name}</span>
              ) : (
                <Link to={crumb.path}>{crumb.name}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Related({ page }: { page: SeoPage }) {
  if (!page.related?.length) return null;
  return (
    <section className="public-related" aria-labelledby="public-related-heading">
      <h2 id="public-related-heading">Keep exploring</h2>
      <ul>
        {page.related.map((link) => (
          <li key={link.path}>
            <Link to={link.path}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Faqs({ page }: { page: SeoPage }) {
  if (!page.faqs?.length) return null;
  return (
    <section className="public-faq" aria-label="Questions">
      {page.faqs.map((faq) => (
        <div className="public-faq__item" key={faq.question}>
          <h2>{faq.question}</h2>
          <p>{faq.answer}</p>
        </div>
      ))}
    </section>
  );
}

function CityGrid() {
  return (
    <div className="public-mosaic public-mosaic--cities public-city-grid">
      {CITY_CARDS.map((city) => (
        <Link className="public-mosaic__card public-city-card" to={city.path} key={city.slug}>
          <img className="dz-img" src={city.image} alt={`${city.name}, ${city.province}`} width={640} height={360} />
          <span className="public-city-card__copy">
            <strong>{city.name}</strong>
            <small>{city.blurb}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}

const LIFESTYLE_TILES = [
  ["/images/lifestyle/city-nights.webp", "City nights"],
  ["/images/lifestyle/beach-days.webp", "Beach days"],
  ["/images/lifestyle/road-trips.webp", "Road trips"],
  ["/images/lifestyle/good-food.webp", "Good food"],
  ["/images/lifestyle/live-events.webp", "Live events"],
] as const;

function LifestyleMosaic() {
  return (
    <div className="public-mosaic">
      {LIFESTYLE_TILES.map(([src, label]) => (
        <figure key={src} className="public-mosaic__card">
          <img className="dz-img" src={src} alt={`${label} in South Africa`} width={640} height={360} />
          <figcaption>{label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function CatalogPage({ page }: { page: SeoPage }) {
  return (
    <PublicChrome>
      <main className="public-article" id="main-content">
        <Breadcrumbs page={page} />
        <p className="public-article__eyebrow">{page.eyebrow}</p>
        <h1 className="public-article__title">{page.h1}</h1>
        <p className="public-article__intro">{page.intro}</p>
        {page.image ? (
          <figure className="public-article__figure">
            <img
              className="dz-img public-article__hero"
              src={page.image.src}
              alt={page.image.alt}
              width={960}
              height={540}
            />
          </figure>
        ) : null}
        {page.blocks.map((block, index) => (
          <BlockView key={`${block.type}-${index}`} block={block} />
        ))}
        {page.path === "/dating" ? <CityGrid /> : null}
        {page.path === "/lifestyle" ? <LifestyleMosaic /> : null}
        {page.path === "/dating-advice" ? (
          <ul className="public-article__list public-advice-index">
            {[
              ["/dating-advice/online-dating-south-africa", "Online dating in South Africa"],
              ["/dating-advice/first-date-ideas-south-africa", "First date ideas in South Africa"],
              ["/dating-advice/online-dating-safety", "Online dating safety"],
              ["/dating-advice/dating-profile-tips", "Dating profile tips"],
              ["/dating-advice/how-to-start-a-conversation", "How to start a conversation"],
              ["/dating-advice/first-date-safety", "First date safety"],
              ["/dating-advice/long-distance-dating-south-africa", "Long-distance dating in South Africa"],
            ].map(([href, label]) => (
              <li key={href}>
                <h2>
                  <Link to={href}>{label}</Link>
                </h2>
              </li>
            ))}
          </ul>
        ) : null}
        <Faqs page={page} />
        <Related page={page} />
        <p className="public-article__cta-row">
          <Link className="public-article__cta" to="/sign-up">
            Join DateZA free
          </Link>
        </p>
      </main>
    </PublicChrome>
  );
}
