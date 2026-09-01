import { Link } from "react-router-dom";
import type { HqCommandCentreHealth } from "../../../lib/hq/types.ts";
import { presentMetric } from "../commandCentreMetric.ts";
import { FounderMetricInfo, FounderMetricValue } from "./FounderMetricInfo.tsx";

const ROWS = [
  { key: "open", label: "Open reports", pick: (h: HqCommandCentreHealth) => h.trust_safety.open_reports },
  {
    key: "awaiting",
    label: "Awaiting decision",
    pick: (h: HqCommandCentreHealth) => h.trust_safety.awaiting_decision,
  },
  {
    key: "photos",
    label: "Pending photos",
    pick: (h: HqCommandCentreHealth) => h.trust_safety.pending_photo_reviews,
  },
  {
    key: "enforcements",
    label: "Active enforcements",
    pick: (h: HqCommandCentreHealth) => h.trust_safety.active_enforcements,
  },
  {
    key: "oldest",
    label: "Oldest unresolved",
    pick: (h: HqCommandCentreHealth) => h.trust_safety.oldest_open_report_age_seconds,
  },
] as const;

export function FounderTrustSafety({ health }: { health: HqCommandCentreHealth }) {
  const healthy =
    health.attention_signals.filter((signal) => signal.severity === "warning").length === 0;

  return (
    <section className="founder-panel founder-panel--trust" aria-labelledby="founder-trust-title">
      <header className="founder-panel__header">
        <div>
          <h2 id="founder-trust-title" className="founder-panel__title">
            Trust &amp; Safety
          </h2>
          <p className="founder-panel__subtitle">
            {healthy ? "Workload looks calm on this brand." : "Some items need operator attention."}
          </p>
        </div>
        <Link className="founder-link-arrow" to="/hq/trust-safety">
          View Trust &amp; Safety
        </Link>
      </header>
      <div className="founder-trust-row">
        {ROWS.map((row) => {
          const metric = row.pick(health);
          const presentation = presentMetric(metric);
          return (
            <article key={row.key} className="founder-trust-stat">
              <span className="founder-trust-stat__label">
                {row.label}
                <FounderMetricInfo metric={metric} label={row.label} />
              </span>
              <FounderMetricValue presentation={presentation} large />
            </article>
          );
        })}
      </div>
    </section>
  );
}
