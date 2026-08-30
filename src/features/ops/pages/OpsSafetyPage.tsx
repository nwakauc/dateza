import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchHqSecurityAlerts,
  fetchRepeatOffenders,
  fetchTrustSafetyEnforcements,
  fetchTrustSafetyOverview,
  hqErrorMessage,
} from "../../../lib/hq/api.ts";
import { canReadSecurityAlerts } from "../../../lib/hq/enforcementAccess.ts";
import type { HqRepeatOffenderList, HqSecurityAlertList, HqTrustSafetyOverview } from "../../../lib/hq/types.ts";
import { useHqOperator } from "../../hq/useHqOperator.ts";
import { OpsBanner, OpsMetricCard, OpsTable } from "../components/OpsPrimitives.tsx";
import { formatAgeSeconds, formatWhen, humanizeKey } from "../opsFormat.ts";

export default function OpsSafetyPage() {
  const { operator } = useHqOperator();
  const [overview, setOverview] = useState<HqTrustSafetyOverview | null>(null);
  const [offenders, setOffenders] = useState<HqRepeatOffenderList | null>(null);
  const [enforcements, setEnforcements] = useState<Awaited<ReturnType<typeof fetchTrustSafetyEnforcements>> | null>(null);
  const [alerts, setAlerts] = useState<HqSecurityAlertList | null>(null);
  const [error, setError] = useState<string>();

  const canAlerts = canReadSecurityAlerts(operator);

  useEffect(() => {
    let cancelled = false;
    const requests: Promise<unknown>[] = [
      fetchTrustSafetyOverview(),
      fetchRepeatOffenders(100),
      fetchTrustSafetyEnforcements({ limit: 25 }),
    ];
    if (canAlerts) {
      requests.push(fetchHqSecurityAlerts({ limit: 25 }));
    }

    void Promise.all(requests)
      .then((results) => {
        if (cancelled) return;
        const [ov, off, enf, alertPage] = results;
        setOverview(ov as HqTrustSafetyOverview);
        setOffenders(off as HqRepeatOffenderList);
        setEnforcements(enf as Awaited<ReturnType<typeof fetchTrustSafetyEnforcements>>);
        if (alertPage) {
          setAlerts(alertPage as HqSecurityAlertList);
        }
      })
      .catch((caught) => {
        if (!cancelled) setError(hqErrorMessage(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [canAlerts]);

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

      {canAlerts ? (
        <section className="ops-card" style={{ marginBottom: 16 }}>
          <h3>Security alerts</h3>
          <p className="ops-muted">Warning, high, and critical brand events. Read-only — acknowledgement is not available yet.</p>
          <OpsTable
            columns={[
              { key: "event", header: "Event" },
              { key: "severity", header: "Severity" },
              { key: "member", header: "Member" },
              { key: "when", header: "When" },
            ]}
            rows={(alerts?.alerts ?? []).map((row) => ({
              event: humanizeKey(row.event_type),
              severity: row.severity,
              member: row.member_360_lookup ? (
                <Link className="ops-inline-link" to={`/ops/users/${encodeURIComponent(row.member_360_lookup)}`}>
                  Open
                </Link>
              ) : (
                "—"
              ),
              when: formatWhen(row.created_at),
            }))}
            empty="No security alerts on this brand."
          />
        </section>
      ) : null}

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
            { key: "kind", header: "Kind" },
            { key: "state", header: "State" },
            { key: "profile", header: "Profile" },
            { key: "when", header: "Created" },
          ]}
          rows={(enforcements?.enforcements ?? []).map((row) => ({
            id: row.id,
            kind: humanizeKey(row.kind),
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
