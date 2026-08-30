import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../../lib/api/errors.ts";
import {
  fetchHqAuthAttempts,
  fetchHqDiscoveryDiagnostic,
  fetchHqEnforcements,
  fetchHqMember360,
  fetchHqSecurityEvents,
  hqErrorMessage,
  reinstateAdminProfile,
  suspendAdminProfile,
} from "../../../lib/hq/api.ts";
import { displayNameForMember } from "../../../lib/hq/parse.ts";
import type { HqMember360 } from "../../../lib/hq/types.ts";
import { HqHistoryPanel } from "../../hq/components/HqHistoryPanel.tsx";
import { useHqOperator } from "../../hq/useHqOperator.ts";
import { OpsBanner, OpsEmpty, OpsMetricCard } from "../components/OpsPrimitives.tsx";
import { opsCan } from "../opsCapabilities.ts";
import { formatWhen } from "../opsFormat.ts";

type LoadResult =
  | { status: "ready"; member: HqMember360 }
  | { status: "forbidden" | "not_found" | "error"; message: string };

export default function OpsUserDetailPage() {
  const { lookup: lookupParam } = useParams();
  const { operator } = useHqOperator();
  const lookup = lookupParam ? decodeURIComponent(lookupParam) : "";
  const [load, setLoad] = useState<LoadResult | null>(null);
  const [actionError, setActionError] = useState<string>();
  const [actionPending, setActionPending] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  const canSuspend = opsCan(operator, "admin.enforcements.manage");
  const canReadSecurity = opsCan(operator, "hq.member.security_read");
  const canReadDiagnostic = opsCan(operator, "hq.discovery_diagnostics.read");

  useEffect(() => {
    if (!lookup) {
      return;
    }
    let cancelled = false;
    void fetchHqMember360(lookup)
      .then((member) => {
        if (!cancelled) {
          setLoad({ status: "ready", member });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 403) {
          setLoad({ status: "forbidden", message: hqErrorMessage(error) });
          return;
        }
        if (error instanceof ApiError && error.status === 404) {
          setLoad({ status: "not_found", message: hqErrorMessage(error) });
          return;
        }
        setLoad({ status: "error", message: hqErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [lookup]);

  const reload = useCallback(async () => {
    if (!lookup) return;
    try {
      const member = await fetchHqMember360(lookup);
      setLoad({ status: "ready", member });
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        setLoad({ status: "forbidden", message: hqErrorMessage(error) });
        return;
      }
      if (error instanceof ApiError && error.status === 404) {
        setLoad({ status: "not_found", message: hqErrorMessage(error) });
        return;
      }
      setLoad({ status: "error", message: hqErrorMessage(error) });
    }
  }, [lookup]);

  const title = useMemo(() => {
    if (load?.status === "ready") return displayNameForMember(load.member);
    return lookup || "Member";
  }, [load, lookup]);

  async function onSuspend() {
    if (!load || load.status !== "ready") return;
    const profile = load.member.sections.profile;
    if (!profile.exists || !profile.public_id) return;
    setActionPending(true);
    setActionError(undefined);
    try {
      await suspendAdminProfile(profile.public_id);
      setShowSuspendConfirm(false);
      await reload();
    } catch (error) {
      setActionError(hqErrorMessage(error));
    } finally {
      setActionPending(false);
    }
  }

  async function onReinstate() {
    if (!load || load.status !== "ready") return;
    const profile = load.member.sections.profile;
    if (!profile.exists || !profile.public_id) return;
    setActionPending(true);
    setActionError(undefined);
    try {
      await reinstateAdminProfile(profile.public_id);
      await reload();
    } catch (error) {
      setActionError(hqErrorMessage(error));
    } finally {
      setActionPending(false);
    }
  }

  if (!load) return <p className="ops-muted">Loading member…</p>;

  if (load.status !== "ready") {
    return (
      <OpsBanner
        tone={load.status === "forbidden" ? "forbidden" : "error"}
        title="Member unavailable"
        body={load.message}
        action={
          <Link className="ops-btn" to="/ops/users">
            Back to search
          </Link>
        }
      />
    );
  }

  const member = load.member;
  const profile = member.sections.profile;
  const identity = member.sections.identity;
  const safety = member.sections.safety;
  const suspended = profile.exists && profile.status === "suspended";

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <Link className="ops-btn" to="/ops/users">
          Back to search
        </Link>
        {canSuspend && profile.exists ? (
          suspended ? (
            <button type="button" className="ops-btn ops-btn--primary" disabled={actionPending} onClick={() => void onReinstate()}>
              Reinstate profile
            </button>
          ) : (
            <button type="button" className="ops-btn ops-btn--danger" disabled={actionPending} onClick={() => setShowSuspendConfirm(true)}>
              Suspend profile
            </button>
          )
        ) : null}
      </div>

      {actionError ? <OpsBanner tone="error" title="Action failed" body={actionError} /> : null}

      {showSuspendConfirm ? (
        <div className="ops-card" style={{ marginBottom: 12 }}>
          <p>Suspend this profile on the current brand? This is audited and enforced server-side.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="ops-btn ops-btn--danger" disabled={actionPending} onClick={() => void onSuspend()}>
              Confirm suspension
            </button>
            <button type="button" className="ops-btn" onClick={() => setShowSuspendConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <h2 style={{ marginTop: 0 }}>{title}</h2>

      <div className="ops-metrics" style={{ marginBottom: 16 }}>
        <OpsMetricCard label="User ID" value={member.member.user_id} />
        <OpsMetricCard label="Membership" value={member.member.membership_status} />
        <OpsMetricCard label="Reports received" value={safety.reports_received_count} />
        <OpsMetricCard label="Enforcements" value={safety.enforcement_count} />
      </div>

      {!profile.exists ? (
        <OpsEmpty title="No profile on this brand" body="sections.profile.exists is false — product and discovery data may still be limited." />
      ) : (
        <section className="ops-card" style={{ marginBottom: 12 }}>
          <h3>Profile</h3>
          <p>
            {profile.display_name ?? "—"} · {profile.status} · {profile.city ?? "No city"}
          </p>
          <p className="ops-muted">Public id: {profile.public_id}</p>
        </section>
      )}

      <section className="ops-card" style={{ marginBottom: 12 }}>
        <h3>Identity</h3>
        <p>
          {identity.first_name ?? ""} {identity.last_name ?? ""}
        </p>
        <p className="ops-muted">Member since {formatWhen(identity.member_since)}</p>
      </section>

      {canReadSecurity ? (
        <section className="ops-card" style={{ marginBottom: 12 }}>
          <h3>Security history</h3>
          <HqHistoryPanel
            key={`${lookup}-security`}
            loadPage={(cursor) =>
              fetchHqSecurityEvents(lookup, { cursor, limit: 25 }).then((page) => ({
                rows: page.security_events,
                next_cursor: page.next_cursor,
              }))
            }
            columns={[
              { key: "event", header: "Event" },
              { key: "severity", header: "Severity" },
              { key: "when", header: "When" },
            ]}
            mapRow={(row) => ({
              event: row.event_type,
              severity: row.severity,
              when: formatWhen(row.created_at),
            })}
            emptyLabel="No security events for this member."
          />
        </section>
      ) : null}

      {canReadSecurity ? (
        <section className="ops-card" style={{ marginBottom: 12 }}>
          <h3>Auth attempts</h3>
          <HqHistoryPanel
            key={`${lookup}-auth`}
            loadPage={(cursor) =>
              fetchHqAuthAttempts(lookup, { cursor, limit: 25 }).then((page) => ({
                rows: page.auth_attempts,
                next_cursor: page.next_cursor,
              }))
            }
            columns={[
              { key: "kind", header: "Kind" },
              { key: "result", header: "Result" },
              { key: "when", header: "When" },
            ]}
            mapRow={(row) => ({
              kind: row.kind,
              result: row.result,
              when: formatWhen(row.created_at),
            })}
            emptyLabel="No auth attempts for this member."
          />
        </section>
      ) : null}

      {canReadSecurity ? (
        <section className="ops-card" style={{ marginBottom: 12 }}>
          <h3>Enforcement history</h3>
          <HqHistoryPanel
            key={`${lookup}-enforcements`}
            loadPage={(cursor) =>
              fetchHqEnforcements(lookup, { cursor, limit: 25 }).then((page) => ({
                rows: page.enforcements,
                next_cursor: page.next_cursor,
              }))
            }
            columns={[
              { key: "state", header: "State" },
              { key: "reason", header: "Reason" },
              { key: "when", header: "When" },
            ]}
            mapRow={(row) => ({
              state: row.state,
              reason: row.reason ?? "—",
              when: formatWhen(row.created_at),
            })}
            emptyLabel="No enforcements for this member."
          />
        </section>
      ) : null}

      {canReadDiagnostic && profile.exists ? (
        <DiscoveryPanel lookup={lookup} />
      ) : null}
    </div>
  );
}

function DiscoveryPanel({ lookup }: { lookup: string }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState<string>();
  const [eligible, setEligible] = useState<boolean | null>(null);

  async function load() {
    setState("loading");
    try {
      const data = await fetchHqDiscoveryDiagnostic(lookup);
      setEligible(data.eligible);
      setMessage(data.ineligibility_reason ?? undefined);
      setState("ready");
    } catch (error) {
      setState("error");
      setMessage(hqErrorMessage(error));
    }
  }

  return (
    <section className="ops-card">
      <h3>Discovery diagnostic</h3>
      <button type="button" className="ops-btn" disabled={state === "loading"} onClick={() => void load()}>
        {state === "loading" ? "Loading…" : "Run diagnostic"}
      </button>
      {state === "ready" ? (
        <p className="ops-muted">
          Eligible: {eligible ? "yes" : "no"}
          {message ? ` · ${message}` : ""}
        </p>
      ) : null}
      {state === "error" ? <OpsBanner tone="error" title="Diagnostic failed" body={message ?? ""} /> : null}
    </section>
  );
}
