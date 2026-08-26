import { Link } from "react-router-dom";
import type { ProfileCompletion } from "../../../lib/api/profileTypes.ts";
import { hrefForCompletionKey } from "../completionLinks.ts";
import type { DatezaRichness } from "../richProfileGaps.ts";

type Props = {
  profileCompletion: ProfileCompletion | null;
  richness: DatezaRichness;
};

export function ProfileStrengthCard({ profileCompletion, richness }: Props) {
  const d8nReportsGaps =
    profileCompletion != null &&
    (Math.round(profileCompletion.percent) < 100 ||
      profileCompletion.suggestions.length > 0 ||
      profileCompletion.missing.length > 0);

  const percent = d8nReportsGaps && profileCompletion
    ? Math.max(0, Math.min(100, Math.round(profileCompletion.percent)))
    : richness.percent;
  const items =
    d8nReportsGaps && profileCompletion
      ? (profileCompletion.suggestions.length > 0
          ? profileCompletion.suggestions
          : profileCompletion.missing.map((key) => ({ key, label: key.replace(/_/g, " ") }))
        ).slice(0, 4)
      : richness.items;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  const complete = percent >= 100 && items.length === 0;

  return (
    <section className="edit-strength" aria-label="Profile strength">
      <h2>Profile strength</h2>
      <div className="edit-strength__meter">
        <svg className="edit-strength__ring" viewBox="0 0 72 72" aria-hidden="true">
          <circle className="edit-strength__track" cx="36" cy="36" r={radius} />
          <circle
            className="edit-strength__progress"
            cx="36"
            cy="36"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div>
          <p className="edit-strength__percent">{percent}%</p>
          <p className="edit-strength__copy">
            {complete ? "Your profile is looking strong." : "More details = more meaningful matches."}
          </p>
        </div>
      </div>
      {items.length > 0 ? (
        <ul className="edit-strength__list">
          {items.map((item) => (
            <li key={item.key}>
              <Link to={hrefForCompletionKey(item.key)}>{item.label}</Link>
            </li>
          ))}
        </ul>
      ) : null}
      {items[0] ? (
        <Link className="edit-strength__cta" to={hrefForCompletionKey(items[0].key)}>
          See suggestions
        </Link>
      ) : null}
    </section>
  );
}
