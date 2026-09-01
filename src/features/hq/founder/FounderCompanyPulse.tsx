import type { HqCommandCentreHealth } from "../../../lib/hq/types.ts";
import { presentMetric } from "../commandCentreMetric.ts";
import { FounderPulseAreaChart } from "./charts/FounderCharts.tsx";
import { FounderMetricInfo } from "./FounderMetricInfo.tsx";

const PULSE_WINDOWS = [
  { key: "today", label: "Today" },
  { key: "last_7d", label: "7 days" },
  { key: "last_30d", label: "30 days" },
] as const;

const PULSE_METRICS = [
  {
    key: "active",
    title: "Active users",
    color: "#3b82f6",
    pick: (health: HqCommandCentreHealth, windowKey: string) =>
      health.activity.active_users[windowKey],
  },
  {
    key: "new",
    title: "New members",
    color: "#22c55e",
    pick: (health: HqCommandCentreHealth, windowKey: string) =>
      health.audience.memberships_new[windowKey],
  },
  {
    key: "matches",
    title: "Matches",
    color: "#ec4899",
    pick: (health: HqCommandCentreHealth, windowKey: string) =>
      health.marketplace.matches_created[windowKey],
  },
] as const;

export function FounderCompanyPulse({ health }: { health: HqCommandCentreHealth }) {
  const series = PULSE_METRICS.map((metric) => ({
    key: metric.key,
    label: metric.title,
    color: metric.color,
    points: PULSE_WINDOWS.map((window) => {
      const metricValue = metric.pick(health, window.key);
      const presentation = presentMetric(metricValue);
      return {
        window: health.windows[window.key]?.label ?? window.label,
        value: presentation.numeric,
        unavailable: presentation.status === "unavailable",
      };
    }),
  }));

  return (
    <section className="founder-panel founder-panel--pulse" aria-labelledby="founder-pulse-title">
      <header className="founder-panel__header founder-panel__header--compact">
        <div>
          <h2 id="founder-pulse-title" className="founder-panel__title">
            Company pulse
          </h2>
          <p className="founder-panel__subtitle">
            Snapshot windows — today, 7 days, and 30 days.
          </p>
        </div>
        <FounderMetricInfo
          metric={PULSE_METRICS[0].pick(health, "today")}
          label="Company pulse"
          windowLabel={health.windows.today?.label}
        />
      </header>

      <div className="founder-pulse-layout">
        <FounderPulseAreaChart
          series={series}
          ariaLabel="Active users, new members, and matches across snapshot windows"
        />
        <ul className="founder-pulse-legend">
          {PULSE_METRICS.map((metric) => (
            <li key={metric.key} className="founder-pulse-legend__group">
              <span className="founder-pulse-legend__title">
                <span
                  className="founder-pulse-legend__dot"
                  style={{ background: metric.color }}
                  aria-hidden="true"
                />
                {metric.title}
              </span>
              <dl className="founder-pulse-legend__values">
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
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
