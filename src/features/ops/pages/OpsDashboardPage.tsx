import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useHqOperator } from "../../hq/useHqOperator.ts";
import { OpsBanner, OpsEmpty, OpsMetricCard, OpsTable } from "../components/OpsPrimitives.tsx";
import { useOpsDashboard } from "../hooks/useOpsDashboard.ts";
import { formatAgeSeconds, formatWhen, humanizeKey } from "../opsFormat.ts";
import { opsCan } from "../opsCapabilities.ts";

export default function OpsDashboardPage() {
  const { operator } = useHqOperator();
  const { state, load } = useOpsDashboard(operator);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refresh = useCallback(() => {
    setRefreshNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!operator) {
      return;
    }
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        return load();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [load, operator, refreshNonce]);

  if (state.status === "loading") {
    return <p className="ops-muted">Loading dashboard…</p>;
  }

  if (state.status === "error") {
    return (
      <OpsBanner
        tone="forbidden"
        title="Dashboard unavailable"
        body={state.message}
        action={
          <button type="button" className="ops-btn" onClick={refresh}>
            Retry
          </button>
        }
      />
    );
  }

  const { data, updatedAt } = state;
  const overview = data.overview;
  const openReports = overview?.reports.by_status.open ?? null;
  const awaiting = overview?.reports.awaiting_decision ?? null;
  const oldestAge = overview?.reports.oldest_open_report_age_seconds ?? null;
  const activeEnforcement = overview?.enforcements.active ?? null;

  return (
    <div className="ops-stack">
      <p className="ops-muted">Last updated {formatWhen(updatedAt)}</p>

      {state.status === "partial" ? (
        <OpsBanner
          tone="warning"
          title="Some dashboard data could not load"
          body={state.errors.join(" ")}
        />
      ) : null}

      <div className="ops-metrics">
        {overview ? (
          <>
            <OpsMetricCard label="Open reports" value={openReports ?? "—"} />
            <OpsMetricCard label="Awaiting decision" value={awaiting ?? "—"} />
            <OpsMetricCard
              label="Oldest open report"
              value={formatAgeSeconds(oldestAge)}
              hint={
                overview.reports.sla_status === "not_configured"
                  ? "SLA not configured"
                  : undefined
              }
              badge={overview.reports.sla_status === "not_configured" ? "NOT CONFIGURED" : undefined}
            />
            <OpsMetricCard label="Active enforcements" value={activeEnforcement ?? "—"} />
          </>
        ) : null}

        {data.pendingPhotos !== null ? (
          <OpsMetricCard
            label="Pending photos"
            value={data.pendingPhotos}
            hint="Moderation queue"
          />
        ) : null}

        {data.repeatOffenderCount !== null ? (
          <OpsMetricCard
            label="Repeat offenders"
            value={data.repeatOffenderCount}
            hint={data.repeatOffenderTruncated ? "List truncated at 100" : "At least 2 reports"}
          />
        ) : null}
      </div>

      {!overview && data.pendingPhotos === null && data.repeatOffenderCount === null ? (
        <OpsEmpty
          title="No dashboard metrics available"
          body="Your operator role does not include trust & safety or photo moderation capabilities on this brand."
        />
      ) : null}

      {data.recentEnforcements.length > 0 ? (
        <section className="ops-card" style={{ marginTop: 16 }}>
          <h2 style={{ marginTop: 0 }}>Recent enforcement activity</h2>
          <OpsTable
            columns={[
              { key: "id", header: "ID" },
              { key: "state", header: "State" },
              { key: "profile", header: "Profile" },
              { key: "when", header: "Created" },
            ]}
            rows={data.recentEnforcements.map((row) => ({
              id: row.id,
              state: humanizeKey(row.state),
              profile: row.profile_id ? (
                <Link className="ops-inline-link" to={`/ops/users/${encodeURIComponent(row.profile_id)}`}>
                  Open member
                </Link>
              ) : (
                "—"
              ),
              when: formatWhen(row.created_at),
            }))}
            empty="No recent enforcements."
          />
        </section>
      ) : opsCan(operator, "hq.trust_safety.read") ? (
        <p className="ops-muted" style={{ marginTop: 16 }}>
          No recent enforcement activity on this brand.
        </p>
      ) : null}

      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {opsCan(operator, "admin.reports.read") ? (
          <Link className="ops-btn ops-btn--primary" to="/ops/reports">
            Open report queue
          </Link>
        ) : null}
        {opsCan(operator, "admin.profile_photos.moderate") ? (
          <Link className="ops-btn" to="/ops/photos">
            Review photos
          </Link>
        ) : null}
        {opsCan(operator, "hq.member.sensitive_read") ? (
          <Link className="ops-btn" to="/ops/users">
            Search members
          </Link>
        ) : null}
      </div>
    </div>
  );
}
