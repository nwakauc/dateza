import type { HqCommandCentreHealth } from "../../../lib/hq/types.ts";
import { presentMetric } from "../commandCentreMetric.ts";
import { FounderSparkline } from "./charts/FounderCharts.tsx";
import { FounderMetricInfo, FounderMetricValue } from "./FounderMetricInfo.tsx";

const HERO_SPECS = [
  {
    key: "members",
    label: "Total members",
    emoji: "👥",
    tone: "blue",
    pick: (health: HqCommandCentreHealth) => health.audience.memberships_total,
    sparkline: (health: HqCommandCentreHealth) => [
      presentMetric(health.audience.memberships_new.today).numeric,
      presentMetric(health.audience.memberships_new.last_7d).numeric,
      presentMetric(health.audience.memberships_new.last_30d).numeric,
    ],
    hint: (health: HqCommandCentreHealth) => {
      const today = presentMetric(health.audience.memberships_new.today);
      return today.status === "available" && today.numeric !== null
        ? `+${today.numeric.toLocaleString("en-ZA")} today`
        : null;
    },
    windowKey: null as string | null,
  },
  {
    key: "new",
    label: "New members",
    emoji: "✨",
    tone: "green",
    pick: (health: HqCommandCentreHealth) => health.audience.memberships_new.today,
    sparkline: (health: HqCommandCentreHealth) => [
      presentMetric(health.audience.memberships_new.today).numeric,
      presentMetric(health.audience.memberships_new.last_7d).numeric,
      presentMetric(health.audience.memberships_new.last_30d).numeric,
    ],
    hint: () => "Today",
    windowKey: "today",
  },
  {
    key: "active",
    label: "Active today",
    emoji: "💫",
    tone: "blue",
    pick: (health: HqCommandCentreHealth) => health.activity.active_users.today,
    sparkline: (health: HqCommandCentreHealth) => [
      presentMetric(health.activity.active_users.today).numeric,
      presentMetric(health.activity.active_users.last_7d).numeric,
      presentMetric(health.activity.active_users.last_30d).numeric,
    ],
    hint: () => "Engaged members",
    windowKey: "today",
  },
  {
    key: "matches",
    label: "Matches today",
    emoji: "💗",
    tone: "pink",
    pick: (health: HqCommandCentreHealth) => health.marketplace.matches_created.today,
    sparkline: (health: HqCommandCentreHealth) => [
      presentMetric(health.marketplace.matches_created.today).numeric,
      presentMetric(health.marketplace.matches_created.last_7d).numeric,
      presentMetric(health.marketplace.matches_created.last_30d).numeric,
    ],
    hint: () => "Mutual likes",
    windowKey: "today",
  },
  {
    key: "reports",
    label: "Open reports",
    emoji: "🛡️",
    tone: "orange",
    pick: (health: HqCommandCentreHealth) => health.trust_safety.open_reports,
    sparkline: () => [null, null, null],
    hint: () => "Trust queue",
    windowKey: null,
  },
] as const;

const SPARKLINE_COLORS: Record<(typeof HERO_SPECS)[number]["tone"], string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  pink: "#ec4899",
  orange: "#f97316",
};

export function FounderHeroMetrics({ health }: { health: HqCommandCentreHealth }) {
  return (
    <section className="founder-hero" aria-label="Key company signals">
      {HERO_SPECS.map((spec) => {
        const metric = spec.pick(health);
        const presentation = presentMetric(metric);
        const windowLabel = spec.windowKey
          ? health.windows[spec.windowKey]?.label
          : undefined;
        const hint = spec.hint(health);
        const sparkValues = spec.sparkline(health);
        const hasSparkline = sparkValues.some((value) => value !== null);

        return (
          <article key={spec.key} className={`founder-hero__item founder-hero__item--${spec.tone}`}>
            <div className="founder-hero__top">
              <span className={`founder-hero__icon founder-hero__icon--${spec.tone}`} aria-hidden="true">
                {spec.emoji}
              </span>
              <header className="founder-hero__head">
                <span className="founder-hero__label">{spec.label}</span>
                <FounderMetricInfo metric={metric} label={spec.label} windowLabel={windowLabel} />
              </header>
            </div>
            <FounderMetricValue presentation={presentation} large />
            <div className="founder-hero__footer">
              {hint ? <span className="founder-hero__hint">{hint}</span> : null}
              {hasSparkline ? (
                <FounderSparkline
                  values={sparkValues}
                  color={SPARKLINE_COLORS[spec.tone]}
                  ariaLabel={`${spec.label} trend across snapshot windows`}
                />
              ) : null}
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function FounderHeroMetricsSkeleton() {
  return (
    <section className="founder-hero founder-hero--skeleton" aria-hidden="true">
      {HERO_SPECS.map((spec) => (
        <div key={spec.key} className="founder-hero__item founder-skeleton" />
      ))}
    </section>
  );
}
