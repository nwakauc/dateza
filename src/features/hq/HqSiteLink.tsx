import { Link } from "react-router-dom";

const SITE_HOME = "/discover";

type Props = {
  /** Sidebar footer, compact header chip, or standalone inline escape on gate screens. */
  variant: "sidebar" | "header" | "inline";
  onNavigate?: () => void;
};

/** Return to the member-facing DateZA app from HQ or HQ gate screens. */
export function HqSiteLink({ variant, onNavigate }: Props) {
  if (variant === "sidebar") {
    return (
      <Link to={SITE_HOME} className="hq-site-link hq-site-link--sidebar" onClick={onNavigate}>
        Back to DateZA
      </Link>
    );
  }

  if (variant === "inline") {
    return (
      <Link to={SITE_HOME} className="hq-site-link hq-site-link--inline" onClick={onNavigate}>
        Back to DateZA
      </Link>
    );
  }

  return (
    <Link
      to={SITE_HOME}
      className="hq-control hq-control--button hq-site-link hq-site-link--header"
      onClick={onNavigate}
      aria-label="Back to DateZA"
    >
      DateZA
    </Link>
  );
}
