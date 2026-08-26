import { CheckCircleIcon } from "../shell/icons.tsx";
import { Link } from "react-router-dom";
import type { DiscoverySelection } from "../../lib/api/discoveryTypes.ts";

type Props = {
  selection: DiscoverySelection;
  refreshTime?: string;
};

/**
 * Daily Discover status from `selection`. `count` is how many profiles D8N
 * delivered in this allocation — not likes remaining. Never invent leftover quota.
 */
export function DiscoverDailyPicks({ selection, refreshTime }: Props) {
  const limit = selection.daily_limit;
  const delivered = selection.count;
  const ratio = limit > 0 ? Math.min(1, delivered / limit) : 0;

  return (
    <section className="discover-rail-card" aria-label="Your daily picks">
      <h2 className="discover-rail-card__title">Your daily picks</h2>
      <div className="discover-picks">
        <div
          className="discover-picks__gauge"
          role="img"
          aria-label={`${delivered} of ${limit} curated people today`}
        >
          <svg viewBox="0 0 72 72" aria-hidden="true">
            <circle cx="36" cy="36" r="30" className="discover-picks__track" />
            <circle
              cx="36"
              cy="36"
              r="30"
              className="discover-picks__value"
              strokeDasharray={`${ratio * 188.4} 188.4`}
            />
          </svg>
          <div className="discover-picks__num">
            <strong>{delivered}</strong>
            <span>today</span>
          </div>
        </div>
        <div>
          <p className="discover-rail-card__body">
            {limit} curated people each day.
            {refreshTime ? ` New picks ${refreshTime}.` : ""}
          </p>
          <ul className="discover-picks__facts">
            <li>
              <CheckCircleIcon />
              Real people
            </li>
            <li>
              <CheckCircleIcon />
              Verified contact
            </li>
            <li>
              <CheckCircleIcon />
              Meaningful matches
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function DiscoverEmptySelection({ refreshTime }: { refreshTime?: string }) {
  return (
    <div className="shell-empty">
      <p className="shell-empty__title">No picks right now</p>
      <p className="shell-empty__body">
        {refreshTime
          ? `DateZA is putting together your next selection. New picks arrive ${refreshTime}.`
          : "DateZA is putting together your next selection. Check back later."}
      </p>
      <div className="discover-empty-actions">
        <Link className="shell-primary-action" to="/find">
          Try Find
        </Link>
        <Link className="shell-text-action" to="/profile/edit">
          Improve your profile
        </Link>
      </div>
    </div>
  );
}

export function DiscoverFilteredEmpty({ onClear }: { onClear: () => void }) {
  return (
    <div className="shell-empty discover-filtered-empty">
      <p className="shell-empty__title">No one in today's picks matches this filter yet.</p>
      <p className="shell-empty__body">Try widening your filters or explore all of today's picks.</p>
      <div className="discover-empty-actions">
        <button className="shell-primary-action" type="button" onClick={onClear}>
          Clear filters
        </button>
        <button className="shell-text-action" type="button" onClick={onClear}>
          Explore all picks
        </button>
      </div>
    </div>
  );
}
