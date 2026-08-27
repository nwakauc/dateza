import { Link } from "react-router-dom";
import type { ProfileCompletion } from "../../../lib/api/profileTypes.ts";
import { hrefForCompletionKey } from "../completionLinks.ts";
import type { DatezaRichness } from "../richProfileGaps.ts";
import { standOutProgress } from "../standOutProgress.ts";

type Props = {
  profileCompletion: ProfileCompletion | null;
  richness: DatezaRichness;
};

export function ProfileStrengthCard({ profileCompletion, richness }: Props) {
  const progress = standOutProgress(richness, profileCompletion);
  const { percent, items, complete } = progress;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

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
            {complete ? "Your profile is looking strong." : "More details help the right people find you."}
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
