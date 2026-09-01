import type { HqCommandCentreHealth } from "../../../lib/hq/types.ts";
import { presentMetric } from "../commandCentreMetric.ts";
import { FounderMetricInfo, FounderMetricValue } from "./FounderMetricInfo.tsx";

const ENGAGEMENT = [
  {
    key: "likes",
    label: "Likes",
    emoji: "♡",
    tone: "pink",
    pick: (h: HqCommandCentreHealth) => h.marketplace.likes_created.today,
  },
  {
    key: "matches",
    label: "Matches",
    emoji: "💗",
    tone: "rose",
    pick: (h: HqCommandCentreHealth) => h.marketplace.matches_created.today,
  },
  {
    key: "conversations",
    label: "Conversations",
    emoji: "💬",
    tone: "violet",
    pick: (h: HqCommandCentreHealth) => h.marketplace.conversations_created.today,
  },
  {
    key: "no-likes",
    label: "Profiles w/o likes",
    emoji: "💔",
    tone: "orange",
    pick: (h: HqCommandCentreHealth) => h.marketplace.published_without_likes,
  },
] as const;

const FRICTION = [
  {
    key: "zero",
    label: "Zero-discovery",
    emoji: "📂",
    tone: "pink",
    pick: (h: HqCommandCentreHealth) => h.marketplace.zero_discovery_allocations.yesterday,
    windowKey: "yesterday" as const,
  },
  {
    key: "no-likes",
    label: "Published w/o likes",
    emoji: "🖼️",
    tone: "orange",
    pick: (h: HqCommandCentreHealth) => h.marketplace.published_without_likes,
    windowKey: null,
  },
  {
    key: "no-matches",
    label: "Published w/o matches",
    emoji: "💬",
    tone: "blue",
    pick: (h: HqCommandCentreHealth) => h.marketplace.published_without_matches,
    windowKey: null,
  },
] as const;

export function FounderMarketplacePulse({ health }: { health: HqCommandCentreHealth }) {
  return (
    <section className="founder-panel" aria-labelledby="founder-marketplace-title">
      <header className="founder-panel__header founder-panel__header--compact">
        <div>
          <h2 id="founder-marketplace-title" className="founder-panel__title">
            Marketplace pulse
          </h2>
          <p className="founder-panel__subtitle">Engagement and friction at a glance</p>
        </div>
      </header>

      <div className="founder-marketplace-sections">
        <div>
          <header className="founder-marketplace-section__head">
            <h3>Engagement today</h3>
            <FounderMetricInfo
              metric={ENGAGEMENT[0].pick(health)}
              label="Marketplace engagement"
              windowLabel={health.windows.today?.label}
            />
          </header>
          <ul className="founder-tile-grid founder-tile-grid--4">
            {ENGAGEMENT.map((item) => {
              const metric = item.pick(health);
              const presentation = presentMetric(metric);
              return (
                <li key={item.key} className={`founder-tile founder-tile--${item.tone}`}>
                  <span className="founder-tile__emoji" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span className="founder-tile__label">{item.label}</span>
                  <FounderMetricValue presentation={presentation} />
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <header className="founder-marketplace-section__head">
            <h3>Friction indicators</h3>
            <span className="founder-marketplace-section__meta">
              {health.windows.yesterday?.label ?? "Yesterday"}
            </span>
          </header>
          <ul className="founder-tile-grid founder-tile-grid--3">
            {FRICTION.map((item) => {
              const metric = item.pick(health);
              const presentation = presentMetric(metric);
              return (
                <li key={item.key} className={`founder-tile founder-tile--${item.tone}`}>
                  <span className="founder-tile__emoji" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span className="founder-tile__label">{item.label}</span>
                  <FounderMetricValue presentation={presentation} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
