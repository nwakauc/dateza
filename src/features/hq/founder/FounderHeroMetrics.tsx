import type { HqCommandCentreHealth } from "../../../lib/hq/types.ts";
import { presentMetric } from "../commandCentreMetric.ts";
import { FounderMetricInfo, FounderMetricValue } from "./FounderMetricInfo.tsx";

const HERO_SPECS = [
  {
    key: "members",
    label: "Total members",
    pick: (health: HqCommandCentreHealth) => health.audience.memberships_total,
    windowKey: null as string | null,
  },
  {
    key: "new",
    label: "New today",
    pick: (health: HqCommandCentreHealth) => health.audience.memberships_new.today,
    windowKey: "today",
  },
  {
    key: "active",
    label: "Active today",
    pick: (health: HqCommandCentreHealth) => health.activity.active_users.today,
    windowKey: "today",
  },
  {
    key: "matches",
    label: "Matches today",
    pick: (health: HqCommandCentreHealth) => health.marketplace.matches_created.today,
    windowKey: "today",
  },
  {
    key: "reports",
    label: "Open reports",
    pick: (health: HqCommandCentreHealth) => health.trust_safety.open_reports,
    windowKey: null,
  },
] as const;

export function FounderHeroMetrics({ health }: { health: HqCommandCentreHealth }) {
  return (
    <section className="founder-hero" aria-label="Key company signals">
      {HERO_SPECS.map((spec) => {
        const metric = spec.pick(health);
        const presentation = presentMetric(metric);
        const windowLabel = spec.windowKey
          ? health.windows[spec.windowKey]?.label
          : undefined;
        return (
          <article key={spec.key} className="founder-hero__item">
            <header className="founder-hero__head">
              <span className="founder-hero__label">{spec.label}</span>
              <FounderMetricInfo metric={metric} label={spec.label} windowLabel={windowLabel} />
            </header>
            <FounderMetricValue presentation={presentation} large />
            {windowLabel ? <span className="founder-hero__window">{windowLabel}</span> : null}
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
