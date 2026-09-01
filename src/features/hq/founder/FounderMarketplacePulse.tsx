import type { HqCommandCentreHealth } from "../../../lib/hq/types.ts";
import { presentMetric } from "../commandCentreMetric.ts";
import { FounderGroupedBarChart } from "./charts/FounderCharts.tsx";
import { FounderMetricInfo, FounderMetricValue } from "./FounderMetricInfo.tsx";

const ENGAGEMENT = [
  { key: "likes", label: "Likes", pick: (h: HqCommandCentreHealth) => h.marketplace.likes_created.today },
  { key: "matches", label: "Matches", pick: (h: HqCommandCentreHealth) => h.marketplace.matches_created.today },
  {
    key: "conversations",
    label: "Conversations",
    pick: (h: HqCommandCentreHealth) => h.marketplace.conversations_created.today,
  },
] as const;

const FRICTION = [
  {
    key: "zero",
    label: "Zero-discovery (yesterday)",
    pick: (h: HqCommandCentreHealth) => h.marketplace.zero_discovery_allocations.yesterday,
    windowKey: "yesterday",
  },
  {
    key: "no-likes",
    label: "Published without likes",
    pick: (h: HqCommandCentreHealth) => h.marketplace.published_without_likes,
    windowKey: null,
  },
  {
    key: "no-matches",
    label: "Published without matches",
    pick: (h: HqCommandCentreHealth) => h.marketplace.published_without_matches,
    windowKey: null,
  },
] as const;

export function FounderMarketplacePulse({ health }: { health: HqCommandCentreHealth }) {
  const engagementSeries = ENGAGEMENT.map((item, index) => {
    const metric = item.pick(health);
    const presentation = presentMetric(metric);
    const colors = ["#3b6cff", "#d4537e", "#7c5cff"];
    return {
      key: item.key,
      label: item.label,
      value: presentation.numeric,
      color: colors[index] ?? "#3b6cff",
      unavailable: presentation.status !== "available",
    };
  });

  return (
    <section className="founder-panel" aria-labelledby="founder-marketplace-title">
      <header className="founder-panel__header">
        <div>
          <h2 id="founder-marketplace-title" className="founder-panel__title">
            Marketplace pulse
          </h2>
          <p className="founder-panel__subtitle">Is the dating marketplace moving?</p>
        </div>
      </header>

      <div className="founder-marketplace-grid">
        <article className="founder-marketplace-engagement">
          <header>
            <h3>Engagement today</h3>
            <FounderMetricInfo
              metric={ENGAGEMENT[0].pick(health)}
              label="Marketplace engagement"
              windowLabel={health.windows.today?.label}
            />
          </header>
          <FounderGroupedBarChart
            series={engagementSeries}
            ariaLabel="Marketplace engagement today"
            height={180}
          />
          <ul className="founder-marketplace-metrics">
            {ENGAGEMENT.map((item) => {
              const metric = item.pick(health);
              const presentation = presentMetric(metric);
              return (
                <li key={item.key}>
                  <span>{item.label}</span>
                  <FounderMetricValue presentation={presentation} />
                </li>
              );
            })}
          </ul>
        </article>

        <article className="founder-marketplace-friction">
          <header>
            <h3>Friction indicators</h3>
          </header>
          <ul className="founder-friction-list">
            {FRICTION.map((item) => {
              const metric = item.pick(health);
              const presentation = presentMetric(metric);
              return (
                <li key={item.key}>
                  <div className="founder-friction-list__head">
                    <span>{item.label}</span>
                    <FounderMetricInfo
                      metric={metric}
                      label={item.label}
                      windowLabel={
                        item.windowKey ? health.windows[item.windowKey]?.label : undefined
                      }
                    />
                  </div>
                  <FounderMetricValue presentation={presentation} large />
                </li>
              );
            })}
          </ul>
        </article>
      </div>
    </section>
  );
}
