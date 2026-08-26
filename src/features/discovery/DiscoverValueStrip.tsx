import { Link } from "react-router-dom";
import { ChevronRightIcon, CompassIcon, HeartIcon, ShieldCheckIcon } from "../shell/icons.tsx";

// Each card links somewhere real — no fabricated previews/counts. "Smart
// picks" jumps to the grid already on this page; the other two go to
// existing routes (Safety, edit-profile/preferences).
const ITEMS = [
  { Icon: CompassIcon, title: "Smart picks", body: "Curated for you", href: "#discover-grid", action: "See your picks" },
  { Icon: ShieldCheckIcon, title: "Verified members", body: "Real people, real connections", href: "/safety", action: "Learn how verification works" },
  { Icon: HeartIcon, title: "Designed for you", body: "Better matches, better dates", href: "/profile/edit", action: "Review your preferences" },
] as const;

export function DiscoverValueStrip() {
  return (
    <div className="discover-value-strip">
      {ITEMS.map(({ Icon, title, body, href, action }) => {
        const content = (
          <>
            <span className="discover-value-strip__icon">
              <Icon className="discover-value-strip__icon-svg" />
            </span>
            <div>
              <strong className="discover-value-strip__title">{title}</strong>
              <span className="discover-value-strip__body">{body}</span>
              <span className="discover-value-strip__action">
                {action}
                <ChevronRightIcon className="discover-value-strip__chevron" />
              </span>
            </div>
          </>
        );
        return href.startsWith("#") ? (
          <a className="discover-value-strip__item" href={href} key={title}>
            {content}
          </a>
        ) : (
          <Link className="discover-value-strip__item" to={href} key={title}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
