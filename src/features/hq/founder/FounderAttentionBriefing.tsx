import { Link } from "react-router-dom";
import type { HqAttentionSignal } from "../../../lib/hq/types.ts";
import { attentionSignalDrillDown } from "../commandCentreAttention.ts";
import { formatAttentionValue } from "../commandCentreMetric.ts";

const FOUNDER_ACTION_LABELS: Record<string, string> = {
  old_unresolved_report: "Investigate",
  pending_photo_reviews: "Review photos",
  active_enforcements: "View enforcements",
  zero_discovery_allocations: "View members",
  metric_unavailable: "Learn more",
};

function founderActionLabel(signal: HqAttentionSignal): string | null {
  const drillDown = attentionSignalDrillDown(signal);
  if (!drillDown) return null;
  return FOUNDER_ACTION_LABELS[signal.signal] ?? drillDown.label;
}

export function FounderAttentionBriefing({
  signals,
  loading,
  canAnalytics,
}: {
  signals: HqAttentionSignal[];
  loading: boolean;
  canAnalytics: boolean;
}) {
  return (
    <aside className="founder-attention" aria-label="Needs your attention">
      <header className="founder-attention__header">
        <h2>Needs your attention</h2>
        {signals.length > 0 ? (
          <span className="founder-attention__count">
            {signals.length} thing{signals.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </header>

      {!canAnalytics ? (
        <p className="founder-attention__empty">
          Health snapshot requires analytics access. Use Members and Trust &amp; Safety for
          operational work.
        </p>
      ) : loading ? (
        <div className="founder-attention__skeleton founder-skeleton" aria-hidden="true" />
      ) : signals.length === 0 ? (
        <p className="founder-attention__empty">
          Nothing flagged right now. The company looks steady from the current snapshot.
        </p>
      ) : (
        <ol className="founder-attention__list">
          {signals.map((signal, index) => {
            const drillDown = attentionSignalDrillDown(signal);
            const action = founderActionLabel(signal);
            return (
              <li
                key={signal.signal}
                className={`founder-attention__item founder-attention__item--${signal.severity}`}
              >
                <span className="founder-attention__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="founder-attention__body">
                  <h3>{signal.title}</h3>
                  <p>
                    {signal.reason}
                    {signal.unit === "seconds" ? ` (${formatAttentionValue(signal)})` : null}
                  </p>
                  {drillDown && action ? (
                    <Link className="founder-link-arrow" to={drillDown.to}>
                      {action} →
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
