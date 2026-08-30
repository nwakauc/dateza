import { Link } from "react-router-dom";
import { MetricCard, ScoreCard, StatusBadge, UnavailableState } from "../components/HqPrimitives.tsx";

const SCORE_LABELS = ["Growth", "Product", "Revenue", "Customer", "Safety", "System"] as const;

export default function CommandCentrePage() {
  return (
    <div className="hq-content hq-content--with-rail">
      <div className="hq-content__primary">
        <div className="hq-score-grid" aria-label="Company scores">
          {SCORE_LABELS.map((label) => (
            <ScoreCard
              key={label}
              label={label}
              badge={label === "Revenue" ? "NOT CONFIGURED" : "INSUFFICIENT DATA"}
              hint={
                label === "Revenue"
                  ? "Billing does not exist in D8N yet."
                  : "Score inputs are not trustworthy until later HQ phases."
              }
            />
          ))}
        </div>

        <div className="hq-grid-2">
          <MetricCard title="Brands overview">
            <UnavailableState
              badge="COMING LATER"
              title="Brand health cards are not live"
              body="Brand rollups need Phase 5–6 metric foundations. Selecting a brand in the header scopes Member 360 — it is not a fabricated company score."
            />
          </MetricCard>
          <MetricCard title="Company performance">
            <UnavailableState
              badge="NOT CONFIGURED"
              title="No analytics event pipeline"
              body="Users, active users, and revenue charts stay empty until AnalyticsEvent and rollups exist. HQ will not invent trend lines."
            />
          </MetricCard>
        </div>

        <div className="hq-grid-3">
          <MetricCard title="Funnel overview">
            <UnavailableState
              badge="INSUFFICIENT DATA"
              title="Funnel not wired"
              body="Marketplace and funnel dashboards ship in Phase 5."
            />
          </MetricCard>
          <MetricCard title="Acquisition channels">
            <UnavailableState
              badge="NOT CONFIGURED"
              title="No attribution capture"
              body="Registration does not store utm_* or campaign source today."
            />
          </MetricCard>
          <MetricCard title="System health">
            <UnavailableState
              badge="COMING LATER"
              title="Observability vendor not adopted"
              body="Errors, APM, and infra health belong to Phase 3 — not hand-rolled fake uptime."
            />
          </MetricCard>
        </div>

        <div className="hq-grid-4">
          <MetricCard title="Recent deployments">
            <UnavailableState
              badge="NOT CONFIGURED"
              title="No release stamping"
              body="Version/deploy correlation waits for HQ-001."
            />
          </MetricCard>
          <MetricCard title="Top errors">
            <UnavailableState badge="COMING LATER" title="No error tracker" body="Adopt an observability vendor before this card shows data." />
          </MetricCard>
          <MetricCard title="Incidents">
            <UnavailableState badge="COMING LATER" title="No incident system" body="Reserved navigation only." />
          </MetricCard>
          <MetricCard
            title="Company Intelligence"
            action={<StatusBadge tone="accent">AI</StatusBadge>}
          >
            <UnavailableState
              badge="COMING LATER"
              title="Intelligence is deferred"
              body="Phase 7+. Requires trustworthy metrics first — never a demo narrative over empty data."
            />
          </MetricCard>
        </div>
      </div>

      <aside className="hq-attention hq-card" aria-label="What needs my attention">
        <h2 className="hq-attention__title">What needs my attention?</h2>
        <div className="hq-attention-item">
          <div className="hq-attention-item__label">
            <StatusBadge tone="accent">Start here</StatusBadge>
          </div>
          <p className="hq-attention-item__body">
            Use Members to look up a real account. That is the Phase 1 production workflow.
          </p>
        </div>
        <div className="hq-attention-item">
          <div className="hq-attention-item__label">
            <StatusBadge tone="warning">Moderation</StatusBadge>
          </div>
          <p className="hq-attention-item__body">
            Open{" "}
            <Link className="hq-inline-link" to="/hq/trust-safety">
              Trust &amp; Safety
            </Link>{" "}
            for the live report queue. SLA is not configured — overdue counts are unavailable.
          </p>
        </div>
        <div className="hq-attention-item">
          <div className="hq-attention-item__label">
            <StatusBadge tone="neutral">Honest empty</StatusBadge>
          </div>
          <p className="hq-attention-item__body">
            Score cards and charts stay NOT CONFIGURED / INSUFFICIENT DATA until backends exist.
            Fabricated KPIs are forbidden.
          </p>
        </div>
      </aside>
    </div>
  );
}
