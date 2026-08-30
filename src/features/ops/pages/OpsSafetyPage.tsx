import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchRepeatOffenders,
  fetchTrustSafetyEnforcements,
  fetchTrustSafetyOverview,
  hqErrorMessage,
} from "../../../lib/hq/api.ts";
import type { HqRepeatOffenderList, HqTrustSafetyOverview } from "../../../lib/hq/types.ts";
import { OpsBanner, OpsMetricCard, OpsTable } from "../components/OpsPrimitives.tsx";
import { formatAgeSeconds, formatWhen, humanizeKey } from "../opsFormat.ts";

export default function OpsSafetyPage() {
  const [overview, setOverview] = useState<HqTrustSafetyOverview | null>(null);
  const [offenders, setOffenders] = useState<HqRepeatOffenderList | null>(null);
  const [enforcements, setEnforcements] = useState<Awaited<ReturnType<typeof fetchTrustSafetyEnforcements>> | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchTrustSafetyOverview(),
      fetchRepeatOffenders(100),
      fetchTrustSafetyEnforcements({ limit: 25 }),
    ])
      .then(([ov, off, enf]) => {
        if (cancelled) return;
        setOverview(ov);
        setOffenders(off);
        setEnforcements(enf);
      })
      .catch((caught) => {
        if (!cancelled) setError(hqErrorMessage(caught));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <OpsBanner tone="error" title="Safety data unavailable" body={error} />;
  }

  if (!overview) return <p className="ops-muted">Loading safety overview…</p>;

  const reports = overview.reports;

  return (
    <div>
      <OpsBanner
        tone="warning"
        title="SLA not configured"
        body="Trust & Safety SLA thresholds are not configured on this brand. Overdue counts are unavailable."
      />

      <div className="ops-metrics" style={{ marginBottom: 16 }}>
        <OpsMetricCard label="Awaiting decision" value={reports.awaiting_decision} />
        <OpsMetricCard label="Open reports" value={reports.by_status.open ?? 0} />
        <OpsMetricCard label="Oldest open case" value={formatAgeSeconds(reports.oldest_open_report_age_seconds)} />
        <OpsMetricCard label="Active enforcements" value={overview.enforcements.active} />
      </div>

      <section className="ops-card" style={{ marginBottom: 16 }}>
        <h3>Repeat offenders</h3>
        <OpsTable
          columns={[
            { key: "member", header: "Member" },
            { key: "reports", header: "Reports" },
            { key: "awaiting", header: "Awaiting" },
            { key: "latest", header: "Latest" },
          ]}
          rows={(offenders?.repeat_offenders ?? []).map((row) => ({
            member: row.member_360_lookup ? (
              <Link className="ops-inline-link" to={`/ops/users/${encodeURIComponent(row.member_360_lookup)}`}>
                {row.display_name ?? row.profile_id}
              </Link>
            ) : (
              row.display_name ?? "Unavailable"
            ),
            reports: row.report_count,
            awaiting: row.awaiting_decision_count,
            latest: formatWhen(row.latest_report_at),
          }))}
          empty="No repeat offenders on this brand."
        />
        {offenders?.truncated ? <p className="ops-muted">List truncated at 100 profiles.</p> : null}
      </section>

      <section className="ops-card">
        <h3>Enforcement history</h3>
        <OpsTable
          columns={[
            { key: "id", header: "ID" },
            { key: "state", header: "State" },
            { key: "profile", header: "Profile" },
            { key: "when", header: "Created" },
          ]}
          rows={(enforcements?.enforcements ?? []).map((row) => ({
            id: row.id,
            state: humanizeKey(row.state),
            profile: row.profile_id ? (
              <Link className="ops-inline-link" to={`/ops/users/${encodeURIComponent(row.profile_id)}`}>
                Open
              </Link>
            ) : (
              "—"
            ),
            when: formatWhen(row.created_at),
          }))}
          empty="No enforcements recorded."
        />
      </section>
    </div>
  );
}
