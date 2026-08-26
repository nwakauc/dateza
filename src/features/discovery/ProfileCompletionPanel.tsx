import { Link } from "react-router-dom";
import type { Completion, ProfileCompletion } from "../../lib/api/profileTypes.ts";
import { describeMissing } from "./completionCopy.ts";
import { hrefForCompletionKey } from "../profile/completionLinks.ts";
import type { DatezaRichness } from "../profile/richProfileGaps.ts";
import { ShieldCheckIcon } from "../shell/icons.tsx";

type Props = {
  publication?: Completion;
  profileCompletion?: ProfileCompletion;
  datezaRichness?: DatezaRichness;
  compact?: boolean;
};

type Item = { key: string; label: string; href: string };

const STAND_OUT_SUBTITLE = "More details = more meaningful matches.";

/**
 * Prompts members to finish the public DateZA profile, not onboarding publication.
 * D8N `profile_completion` is used when it reports unfinished richness.
 * Publication/onboarding 100% is ignored while public details are still empty.
 */
export function ProfileCompletionPanel({
  publication,
  profileCompletion,
  datezaRichness,
  compact = false,
}: Props) {
  const d8nReportsGaps =
    profileCompletion != null &&
    (Math.round(profileCompletion.percent) < 100 ||
      profileCompletion.suggestions.length > 0 ||
      profileCompletion.missing.length > 0);

  if (profileCompletion != null && d8nReportsGaps) {
    const percent = Math.max(0, Math.min(100, Math.round(profileCompletion.percent)));
    const items: Item[] =
      profileCompletion.suggestions.length > 0
        ? profileCompletion.suggestions.slice(0, 4).map((item) => ({
            key: item.key,
            label: item.label,
            href: hrefForCompletionKey(item.key),
          }))
        : describeMissing(profileCompletion.missing).map((item) => ({
            ...item,
            href: hrefForCompletionKey(item.key),
          }));
    return <CompletionCard compact={compact} percent={percent} items={items} />;
  }

  if (datezaRichness && datezaRichness.filled < datezaRichness.total) {
    return (
      <CompletionCard
        compact={compact}
        percent={datezaRichness.percent}
        items={datezaRichness.items.map((item) => ({
          ...item,
          href: hrefForCompletionKey(item.key),
        }))}
      />
    );
  }

  if (!publication || publication.complete || publication.missing.length === 0) {
    return null;
  }
  const items = describeMissing(publication.missing).map((item) => ({
    ...item,
    href: hrefForCompletionKey(item.key),
  }));
  const percent = Math.max(0, Math.min(100, Math.round(publication.percent)));

  return <CompletionCard compact={compact} percent={percent} items={items} />;
}

function CompletionCard({
  percent,
  items,
  compact,
}: {
  percent: number;
  items: Item[];
  compact: boolean;
}) {
  return (
    <section className={`discover-completion${compact ? " discover-completion--compact" : ""}`} aria-label="Make your profile stand out">
      <h2>Make your profile stand out</h2>
      <p className="discover-completion__subtitle">{STAND_OUT_SUBTITLE}</p>
      <div className="discover-completion__meter">
        <span className="discover-completion__percent">{percent}% complete</span>
        <div className="discover-completion__bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${percent}% complete`}>
          <span style={{ width: `${percent}%` }} />
        </div>
      </div>
      {items.length > 0 && !compact ? (
        <p className="discover-completion__hint sr-only">{items.map((item) => item.label).join(", ")}</p>
      ) : null}
      <div className="discover-completion__actions">
        <Link className="discover-completion__cta" to="/profile/edit">
          Complete profile
        </Link>
        <span className="discover-completion__trust">
          <ShieldCheckIcon />
          <span className="sr-only">Contact details stay private until you choose to share them.</span>
        </span>
      </div>
    </section>
  );
}
