import type { HqCommandCentreHealth } from "../../../lib/hq/types.ts";
import { presentMetric } from "../commandCentreMetric.ts";
import { FounderDonutChart } from "./charts/FounderCharts.tsx";
import { FounderMetricInfo, FounderMetricValue } from "./FounderMetricInfo.tsx";

const STATUS_COLORS: Record<string, string> = {
  draft: "#c9c5be",
  active: "#1f9d63",
  suspended: "#d97706",
};

export function FounderProfileHealth({ health }: { health: HqCommandCentreHealth }) {
  const byStatus = health.profile_health.by_status;
  const statusPresentation = presentMetric(byStatus);
  const activation = presentMetric(health.profile_health.activation_ratio);
  const published = presentMetric(health.profile_health.visible_published);

  const segments =
    statusPresentation.record &&
    Object.entries(statusPresentation.record).map(([key, value]) => ({
      key,
      label: key.replace(/_/g, " "),
      value,
      color: STATUS_COLORS[key] ?? "#8b8b8b",
    }));

  const total =
    segments?.reduce((sum, segment) => sum + segment.value, 0) ??
    statusPresentation.numeric ??
    0;

  return (
    <section className="founder-panel" aria-labelledby="founder-profile-title">
      <header className="founder-panel__header">
        <div>
          <h2 id="founder-profile-title" className="founder-panel__title">
            Profile health
          </h2>
          <p className="founder-panel__subtitle">Lifecycle composition and activation</p>
        </div>
        <FounderMetricInfo metric={byStatus} label="Profiles by status" />
      </header>

      {segments && segments.length > 0 ? (
        <FounderDonutChart
          segments={segments}
          totalLabel="profiles"
          centerValue={total.toLocaleString("en-ZA")}
          ariaLabel="Profile status distribution"
        />
      ) : (
        <p className="founder-empty-inline">{statusPresentation.text}</p>
      )}

      <div className="founder-profile-footer">
        <div className="founder-profile-stat">
          <span className="founder-profile-stat__label">
            Visible published
            <FounderMetricInfo metric={health.profile_health.visible_published} label="Visible published" />
          </span>
          <FounderMetricValue presentation={published} large />
        </div>
        <div className="founder-profile-stat">
          <span className="founder-profile-stat__label">
            Activation
            <FounderMetricInfo metric={health.profile_health.activation_ratio} label="Activation ratio" />
          </span>
          <FounderMetricValue presentation={activation} large />
          {activation.status === "available" && activation.numeric !== null ? (
            <div className="founder-activation-bar" aria-hidden="true">
              <span style={{ width: `${Math.min(100, activation.numeric * 100)}%` }} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
