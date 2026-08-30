import { Link } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useHqOperator } from "../../hq/useHqOperator.ts";
import {
  OpsBanner,
  OpsDashboardSection,
  OpsGenderSplitPlaceholder,
  OpsMetricCard,
  OpsTable,
} from "../components/OpsPrimitives.tsx";
import { useOpsDashboard } from "../hooks/useOpsDashboard.ts";
import { OPS_ANALYTICS_UNAVAILABLE } from "../opsAnalyticsContract.ts";
import { formatAgeSeconds, formatWhen, humanizeKey } from "../opsFormat.ts";
import { opsCan } from "../opsCapabilities.ts";

function topReportReasons(
  byReason: Record<string, number> | undefined,
  limit = 5,
): Array<{ reason: string; count: number }> {
  if (!byReason) return [];
  return Object.entries(byReason)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([reason, count]) => ({ reason, count }));
}

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

  const canAnalytics = opsCan(operator, "hq.analytics.read");
  const canMembers = opsCan(operator, "hq.member.sensitive_read");
  const topReasons = useMemo(
    () => topReportReasons(state.status !== "loading" && state.status !== "error" ? state.data.overview?.reports.by_reason : undefined),
    [state],
  );

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
  const reviewingReports = overview?.reports.by_status.reviewing ?? null;
  const awaiting = overview?.reports.awaiting_decision ?? null;
  const oldestAge = overview?.reports.oldest_open_report_age_seconds ?? null;
  const activeEnforcement = overview?.enforcements.active ?? null;
  const analyticsNote = OPS_ANALYTICS_UNAVAILABLE;

  return (
    <div className="ops-stack">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <p className="ops-muted" style={{ margin: 0, flex: 1 }}>
          Last updated {formatWhen(updatedAt)}
        </p>
        <button type="button" className="ops-btn ops-btn--primary" onClick={refresh}>
          Refresh
        </button>
      </div>

      {state.status === "partial" ? (
        <OpsBanner
          tone="warning"
          title="Some dashboard data could not load"
          body={state.errors.join(" ")}
        />
      ) : null}

      <OpsDashboardSection
        title="Growth & activity"
        description="Signup and active-member rollups need a verified analytics overview from D8N. Week = Sunday–Saturday; month = calendar month from the 1st (brand timezone)."
      >
        {!canAnalytics ? (
          <OpsBanner
            tone="neutral"
            title="Growth analytics not enabled"
            body="Your role does not include hq.analytics.read. Ask an admin to grant analytics access, or use the member directory for newest signups."
          />
        ) : (
          <div className="ops-metrics">
            <OpsMetricCard label="Signups today" unavailable={analyticsNote} value={null} />
            <OpsMetricCard
              label="Signups this week"
              unavailable={analyticsNote}
              value={null}
              hint="Sun–Sat, brand timezone"
            />
            <OpsMetricCard
              label="Signups this month"
              unavailable={analyticsNote}
              value={null}
              hint="From 1st of month"
            />
            <OpsMetricCard label="Active today" unavailable={analyticsNote} value={null} />
            <OpsMetricCard label="Active 7 days" unavailable={analyticsNote} value={null} />
            <OpsMetricCard label="Active 30 days" unavailable={analyticsNote} value={null} />
            <OpsMetricCard label="Total members" unavailable={analyticsNote} value={null} />
          </div>
        )}
      </OpsDashboardSection>

      <OpsDashboardSection title="Demographics">
        <div className="ops-dashboard-grid-2">
          <OpsGenderSplitPlaceholder message="Female vs male split requires the brand analytics overview endpoint. DateZA will not estimate gender from partial directory pages." />
          <div className="ops-card">
            <h3 style={{ marginTop: 0 }}>What you will see here</h3>
            <ul className="ops-muted" style={{ margin: 0, paddingLeft: 18 }}>
              <li>Published members by gender (and other catalog fields the backend exposes)</li>
              <li>Share of active members by gender for today / 7d / 30d</li>
              <li>Server-computed counts only — no client-side guessing</li>
            </ul>
          </div>
        </div>
      </OpsDashboardSection>

      <OpsDashboardSection
        title="Safety & moderation"
        description="Live operational queues for this brand."
      >
        <div className="ops-metrics">
          {overview ? (
            <>
              <OpsMetricCard label="Open reports" value={openReports ?? "—"} />
              <OpsMetricCard label="In review" value={reviewingReports ?? "—"} />
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
            <OpsMetricCard label="Pending photos" value={data.pendingPhotos} hint="Moderation queue" />
          ) : null}

          {data.repeatOffenderCount !== null ? (
            <OpsMetricCard
              label="Repeat offenders"
              value={data.repeatOffenderCount}
              hint={data.repeatOffenderTruncated ? "List truncated at 100" : "At least 2 reports"}
            />
          ) : null}

          <OpsMetricCard
            label="Pending selfies"
            unavailable="No verified admin endpoint for selfie/verification queue counts."
            value={null}
          />
          <OpsMetricCard
            label="Matches / messages"
            unavailable="Engagement totals are not exposed on HQ admin APIs yet."
            value={null}
          />
        </div>

        {topReasons.length > 0 ? (
          <div className="ops-card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Open report reasons</h3>
            <ul className="ops-reason-list">
              {topReasons.map((row) => (
                <li key={row.reason}>
                  <span>{humanizeKey(row.reason)}</span>
                  <strong>{row.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </OpsDashboardSection>

      {canMembers && data.recentSignups.length > 0 ? (
        <OpsDashboardSection
          title="Newest members"
          description="Latest brand signups from the member directory (not a full daily/weekly rollup)."
        >
          <OpsTable
            columns={[
              { key: "member", header: "Member" },
              { key: "joined", header: "Joined" },
              { key: "status", header: "Status" },
              { key: "signals", header: "Signals" },
              { key: "action", header: "" },
            ]}
            rows={data.recentSignups.map((row) => ({
              member: row.display_name?.trim() || `Member ${row.user_id}`,
              joined: formatWhen(row.joined_at),
              status: humanizeKey(row.membership_status),
              signals:
                row.reports_received_count > 0 || row.pending_photo_count > 0 || row.active_enforcement
                  ? [
                      row.reports_received_count > 0 ? `${row.reports_received_count} reports` : null,
                      row.pending_photo_count > 0 ? `${row.pending_photo_count} photos` : null,
                      row.active_enforcement ? "enforced" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "—",
              action: row.profile_id ? (
                <Link className="ops-btn ops-btn--primary" to={`/ops/users/${encodeURIComponent(row.profile_id)}`}>
                  Open
                </Link>
              ) : (
                <span className="ops-muted">No profile</span>
              ),
            }))}
            empty="No members on this brand yet."
          />
          <Link className="ops-inline-link" to="/ops/users" style={{ display: "inline-block", marginTop: 12 }}>
            View full directory
          </Link>
        </OpsDashboardSection>
      ) : null}

      {data.recentEnforcements.length > 0 ? (
        <OpsDashboardSection title="Recent enforcement activity">
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
        </OpsDashboardSection>
      ) : opsCan(operator, "hq.trust_safety.read") ? (
        <p className="ops-muted">No recent enforcement activity on this brand.</p>
      ) : null}

      {!overview && data.pendingPhotos === null && data.repeatOffenderCount === null && !canMembers ? (
        <OpsBanner
          tone="neutral"
          title="Limited dashboard access"
          body="Your operator role does not include trust & safety, photo moderation, or member directory access on this brand."
        />
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
        {canMembers ? (
          <Link className="ops-btn" to="/ops/users">
            Member directory
          </Link>
        ) : null}
      </div>
    </div>
  );
}
