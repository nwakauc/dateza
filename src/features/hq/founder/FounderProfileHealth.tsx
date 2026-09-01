import type { HqCommandCentreHealth } from "../../../lib/hq/types.ts";
import { presentMetric } from "../commandCentreMetric.ts";
import { FounderDonutChart } from "./charts/FounderCharts.tsx";
import { FounderMetricInfo, FounderMetricValue } from "./FounderMetricInfo.tsx";

const STATUS_COLORS: Record<string, string> = {
  active: "#22c55e",
  draft: "#94a3b8",
  suspended: "#f59e0b",
  deleted: "#ef4444",
};

const ACTIVATION_TARGET = 0.7;

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
      color: STATUS_COLORS[key] ?? "#a78bfa",
    }));

  const total =
    segments?.reduce((sum, segment) => sum + segment.value, 0) ??
    statusPresentation.numeric ??
    0;

  const activationPct =
    activation.status === "available" && activation.numeric !== null
      ? Math.min(100, activation.numeric * 100)
      : null;

  return (
    <section className="founder-panel founder-panel--profile" aria-labelledby="founder-profile-title">
      <header className="founder-panel__header founder-panel__header--compact">
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
          totalLabel="Total"
          centerValue={total.toLocaleString("en-ZA")}
          ariaLabel="Profile status distribution"
        />
      ) : (
        <p className="founder-empty-inline">{statusPresentation.text}</p>
      )}

      <div className="founder-profile-activation">
        <div className="founder-profile-activation__head">
          <span className="founder-profile-activation__label">
            Activation rate
            <FounderMetricInfo
              metric={health.profile_health.activation_ratio}
              label="Activation ratio"
            />
          </span>
          <FounderMetricValue presentation={activation} />
        </div>
        {activationPct !== null ? (
          <div className="founder-activation-bar founder-activation-bar--target" aria-hidden="true">
            <span style={{ width: `${activationPct}%` }} />
            <mark style={{ left: `${ACTIVATION_TARGET * 100}%` }} />
          </div>
        ) : null}
        <p className="founder-profile-activation__target">Target {ACTIVATION_TARGET * 100}%</p>
      </div>

      <div className="founder-profile-published">
        <span className="founder-profile-stat__label">
          Visible published
          <FounderMetricInfo
            metric={health.profile_health.visible_published}
            label="Visible published"
          />
        </span>
        <FounderMetricValue presentation={published} />
      </div>
    </section>
  );
}
