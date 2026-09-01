import { Link } from "react-router-dom";
import { useHqBrand } from "../useHqBrand.ts";
import { founderGreeting, formatWhenShort } from "../commandCentreMetric.ts";
import type { CommandCentreData, CommandCentreLoadState } from "../hooks/useCommandCentreData.ts";
import { FounderAttentionBriefing } from "./FounderAttentionBriefing.tsx";
import { FounderBrandComparison } from "./FounderBrandComparison.tsx";
import { FounderCompanyPulse } from "./FounderCompanyPulse.tsx";
import { FounderHeroMetrics, FounderHeroMetricsSkeleton } from "./FounderHeroMetrics.tsx";
import { FounderMarketplacePulse } from "./FounderMarketplacePulse.tsx";
import { FounderProfileHealth } from "./FounderProfileHealth.tsx";
import { FounderSecurityAlerts } from "./FounderSecurityAlerts.tsx";
import { FounderTrustSafety } from "./FounderTrustSafety.tsx";
import "./founder.css";

export function FounderOverview({
  load,
  data,
  partialErrors,
  canAnalytics,
  canAlerts,
  onRefresh,
}: {
  load: CommandCentreLoadState;
  data: CommandCentreData;
  partialErrors: string[];
  canAnalytics: boolean;
  canAlerts: boolean;
  onRefresh: () => void;
}) {
  const { brandName, brandSlug } = useHqBrand();
  const health = data.health;
  const release = data.version?.release ?? data.version?.image_version ?? null;

  return (
    <div className="founder-overview" data-loading={load === "loading" ? "true" : "false"}>
      <header className="founder-intro">
        <div className="founder-intro__copy">
          <p className="founder-intro__eyebrow">D8N at a glance</p>
          <h1 className="founder-intro__title">
            {founderGreeting()}, Founder <span aria-hidden="true">👋</span>
          </h1>
          <p className="founder-intro__meta">
            <span>{brandName ?? brandSlug ?? "Current brand"}</span>
            {health ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Last refreshed {formatWhenShort(health.generated_at)}</span>
              </>
            ) : null}
            {release ? (
              <>
                <span aria-hidden="true">·</span>
                <span>Release {release}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="founder-intro__actions">
          <button type="button" className="founder-refresh" onClick={onRefresh}>
            Refresh
          </button>
        </div>
      </header>

      {partialErrors.length > 0 ? (
        <div className="founder-banner" role="status">
          <strong>Some panels could not load.</strong> {partialErrors.join(" ")}
        </div>
      ) : null}

      {!canAnalytics ? (
        <section className="founder-panel founder-panel--forbidden">
          <h2>Analytics access required</h2>
          <p>
            The Founder dashboard needs <code>hq.analytics.read</code>. You can still use{" "}
            <Link to="/hq/members">Members</Link> and{" "}
            <Link to="/hq/trust-safety">Trust &amp; Safety</Link> when your role includes them.
          </p>
        </section>
      ) : load === "loading" ? (
        <>
          <FounderHeroMetricsSkeleton />
          <div className="founder-bento founder-bento--loading">
            <div className="founder-skeleton founder-skeleton--pulse" />
            <div className="founder-skeleton founder-skeleton--attention" />
            <div className="founder-skeleton founder-skeleton--panel" />
            <div className="founder-skeleton founder-skeleton--panel" />
          </div>
        </>
      ) : health ? (
        <>
          <FounderHeroMetrics health={health} />

          <div className="founder-bento">
            <div className="founder-bento__pulse">
              <FounderCompanyPulse health={health} />
            </div>
            <div className="founder-bento__attention">
              <FounderAttentionBriefing
                signals={health.attention_signals}
                loading={false}
                canAnalytics={canAnalytics}
              />
            </div>
            <div className="founder-bento__profile">
              <FounderProfileHealth health={health} />
            </div>
            <div className="founder-bento__marketplace">
              <FounderMarketplacePulse health={health} />
            </div>
            {data.brands ? (
              <div className="founder-bento__brands">
                <FounderBrandComparison comparison={data.brands} />
              </div>
            ) : data.brandsError ? (
              <div className="founder-bento__brands">
                <section className="founder-panel">
                  <h2 className="founder-panel__title">Brand comparison</h2>
                  <p className="founder-panel__error">{data.brandsError}</p>
                </section>
              </div>
            ) : null}
            <div className="founder-bento__trust">
              <FounderTrustSafety health={health} />
            </div>
            {canAlerts ? (
              <div className="founder-bento__alerts">
                <FounderSecurityAlerts alerts={data.alerts} error={data.alertsError} />
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <section className="founder-panel founder-panel--error">
          <h2>Health snapshot unavailable</h2>
          <p>{data.healthError ?? "Could not load the command centre health snapshot."}</p>
          <button type="button" className="founder-refresh" onClick={onRefresh}>
            Try again
          </button>
        </section>
      )}
    </div>
  );
}
