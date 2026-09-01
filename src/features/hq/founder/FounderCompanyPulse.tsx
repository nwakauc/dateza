import type { HqCommandCentreHealth } from "../../../lib/hq/types.ts";
import { presentMetric } from "../commandCentreMetric.ts";
import { FounderGroupedBarChart, type ChartSeries } from "./charts/FounderCharts.tsx";
import { FounderMetricInfo } from "./FounderMetricInfo.tsx";

const PULSE_WINDOWS = [
  { key: "today", label: "Today", short: "Today" },
  { key: "last_7d", label: "7 days", short: "7d" },
  { key: "last_30d", label: "30 days", short: "30d" },
] as const;

const PULSE_METRICS = [
  {
    key: "active",
    title: "Active users",
    color: "#3b6cff",
    pick: (health: HqCommandCentreHealth, windowKey: string) =>
      health.activity.active_users[windowKey],
  },
  {
    key: "new",
    title: "New members",
    color: "#1f9d63",
    pick: (health: HqCommandCentreHealth, windowKey: string) =>
      health.audience.memberships_new[windowKey],
  },
  {
    key: "matches",
    title: "Matches",
    color: "#d4537e",
    pick: (health: HqCommandCentreHealth, windowKey: string) =>
      health.marketplace.matches_created[windowKey],
  },
] as const;

function buildSeries(
  health: HqCommandCentreHealth,
  metric: (typeof PULSE_METRICS)[number],
): ChartSeries[] {
  return PULSE_WINDOWS.map((window) => {
    const metricValue = metric.pick(health, window.key);
    const presentation = presentMetric(metricValue);
    return {
      key: `${metric.key}-${window.key}`,
      label: window.short,
      value: presentation.numeric,
      color: metric.color,
      unavailable: presentation.status === "unavailable",
    };
  });
}

export function FounderCompanyPulse({ health }: { health: HqCommandCentreHealth }) {
  return (
    <section className="founder-panel founder-panel--pulse" aria-labelledby="founder-pulse-title">
      <header className="founder-panel__header">
        <div>
          <h2 id="founder-pulse-title" className="founder-panel__title">
            Company pulse
          </h2>
          <p className="founder-panel__subtitle">
            Aggregate windows from the health snapshot — not daily history.
          </p>
        </div>
      </header>
      <div className="founder-pulse-grid">
        {PULSE_METRICS.map((metric) => {
          const sample = metric.pick(health, "today");
          return (
            <article key={metric.key} className="founder-pulse-card">
              <header className="founder-pulse-card__head">
                <h3>{metric.title}</h3>
                <FounderMetricInfo
                  metric={sample}
                  label={metric.title}
                  windowLabel={health.windows.today?.label}
                />
              </header>
              <FounderGroupedBarChart
                series={buildSeries(health, metric)}
                ariaLabel={`${metric.title} across today, 7 days, and 30 days`}
              />
              <dl className="founder-pulse-card__legend">
                {PULSE_WINDOWS.map((window) => {
                  const metricValue = metric.pick(health, window.key);
                  const presentation = presentMetric(metricValue);
                  return (
                    <div key={window.key}>
                      <dt>{health.windows[window.key]?.label ?? window.label}</dt>
                      <dd>{presentation.text}</dd>
                    </div>
                  );
                })}
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
