import { Link } from "react-router-dom";
import type { Completion, ProfileCompletion } from "../../lib/api/profileTypes.ts";
import { describeMissing } from "./completionCopy.ts";
import { hrefForCompletionKey } from "../profile/completionLinks.ts";

type Props = {
  publication?: Completion;
  profileCompletion?: ProfileCompletion;
};

/**
 * Post-onboarding richness uses `profile_completion` from GET /profile.
 * Publication `completion` is only a fallback when richness is absent, so
 * a published member is not nagged with onboarding leftovers.
 */
export function ProfileCompletionPanel({ publication, profileCompletion }: Props) {
  const richness = profileCompletion;
  if (richness) {
    const percent = Math.max(0, Math.min(100, Math.round(richness.percent)));
    if (percent >= 100 && richness.suggestions.length === 0) return null;
    const items =
      richness.suggestions.length > 0
        ? richness.suggestions.slice(0, 4).map((item) => ({ key: item.key, label: item.label, href: hrefForCompletionKey(item.key) }))
        : describeMissing(richness.missing).map((item) => ({ ...item, href: hrefForCompletionKey(item.key) }));
    if (items.length === 0) return null;
    return (
      <section className="discover-completion" aria-label="Make your profile stand out">
        <div className="discover-completion__header">
          <h2>Make your profile stand out</h2>
          <span className="discover-completion__percent">{percent}% complete</span>
        </div>
        <p className="discover-completion__subtitle">More detail can help people get to know you.</p>
        <div className="discover-completion__bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${percent}%` }} />
        </div>
        <ul className="discover-completion__list">
          {items.map((item) => (
            <li key={item.key}>
              <Link to={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (!publication || publication.complete || publication.missing.length === 0) {
    return null;
  }
  const items = describeMissing(publication.missing);
  const percent = Math.max(0, Math.min(100, Math.round(publication.percent)));

  return (
    <section className="discover-completion" aria-label="Make your profile stand out">
      <div className="discover-completion__header">
        <h2>Make your profile stand out</h2>
        <span className="discover-completion__percent">{percent}% complete</span>
      </div>
      <p className="discover-completion__subtitle">Give people more reasons to say hello.</p>
      <div className="discover-completion__bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <ul className="discover-completion__list">
        {items.map((item) => (
          <li key={item.key}>
            <Link to={hrefForCompletionKey(item.key)}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
