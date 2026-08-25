import { Link } from "react-router-dom";
import type { Completion } from "../../lib/api/profileTypes.ts";
import { describeMissing } from "./completionCopy.ts";

type Props = {
  completion: Completion;
};

/**
 * Real data only: `completion.percent`/`completion.missing` come from
 * `ProfileOnboardingStatus` (already fetched by AppShell — see
 * useOwnAccount()). Renders nothing once the profile is complete, and never
 * invents a percentage or missing item.
 */
export function ProfileCompletionPanel({ completion }: Props) {
  if (completion.complete || completion.missing.length === 0) {
    return null;
  }
  const items = describeMissing(completion.missing);
  const percent = Math.max(0, Math.min(100, Math.round(completion.percent)));

  return (
    <section className="discover-completion" aria-label="Profile completion">
      <div className="discover-completion__header">
        <h2>Make your profile stand out</h2>
        <span className="discover-completion__percent">{percent}% complete</span>
      </div>
      <p className="discover-completion__subtitle">Complete these to get better matches</p>
      <div className="discover-completion__bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${percent}%` }} />
      </div>
      <ul className="discover-completion__list">
        {items.map((item) => (
          <li key={item.key}>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </li>
        ))}
      </ul>
      <Link className="shell-text-action" to="/profile/edit">
        Complete your profile
      </Link>
    </section>
  );
}
