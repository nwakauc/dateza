import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "../../../lib/api/errors.ts";
import {
  fetchAdminReport,
  hqErrorMessage,
  reinstateAdminProfile,
  suspendAdminProfile,
  updateAdminReport,
} from "../../../lib/hq/api.ts";
import type { HqAdminReport, HqReportStatus, HqUpdateReportBody } from "../../../lib/hq/types.ts";
import {
  MetricCard,
  StateBanner,
  StatGroup,
  StatusBadge,
  UnavailableState,
} from "../components/HqPrimitives.tsx";

type LoadResult =
  | { status: "ready"; report: HqAdminReport }
  | { status: "forbidden"; message: string }
  | { status: "not_found"; message: string }
  | { status: "error"; message: string };

type ActionState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "error"; message: string };

type TransitionTarget = HqUpdateReportBody["status"];

const TRANSITIONS: Record<HqReportStatus, TransitionTarget[]> = {
  open: ["reviewing", "dismissed"],
  reviewing: ["actioned", "dismissed", "open"],
  actioned: [],
  dismissed: [],
};

function formatWhen(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace("T", " ").replace(/\.\d+Z$/, "Z");
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, " ");
}

function formatEvidenceValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatEvidenceValue(item)).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${humanizeKey(k)}: ${formatEvidenceValue(v)}`)
      .join("; ");
  }
  return "—";
}

function evidenceRows(evidence: Record<string, unknown>): Array<{ key: string; value: string }> {
  return Object.entries(evidence).map(([key, value]) => ({
    key: humanizeKey(key),
    value: formatEvidenceValue(value),
  }));
}

function partyLabel(party: HqAdminReport["reported"]): string {
  if (!party) return "—";
  return party.display_name ?? party.id;
}

function PartyLink({ party, label }: { party: HqAdminReport["reported"]; label: string }) {
  if (!party?.id) {
    return (
      <div className="hq-kv">
        <dt>{label}</dt>
        <dd>{partyLabel(party)}</dd>
      </div>
    );
  }
  return (
    <div className="hq-kv">
      <dt>{label}</dt>
      <dd>
        <Link className="hq-inline-link" to={`/hq/members/${encodeURIComponent(party.id)}`}>
          {partyLabel(party)}
        </Link>
      </dd>
    </div>
  );
}

export default function ReportDetailPage() {
  const { reportId: reportIdParam } = useParams();
  const reportId = Number.parseInt(reportIdParam ?? "", 10);
  const validId = Number.isFinite(reportId) && reportId > 0;
  const [load, setLoad] = useState<{ key: string; result: LoadResult | null }>({
    key: "",
    result: null,
  });
  const [action, setAction] = useState<ActionState>({ status: "idle" });
  const [pendingStatus, setPendingStatus] = useState<TransitionTarget | null>(null);
  const [note, setNote] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reinstateOpen, setReinstateOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);

  const requestKey = `${validId ? reportId : "invalid"}:${reloadNonce}`;
  const refresh = useCallback(() => setReloadNonce((n) => n + 1), []);

  useEffect(() => {
    if (!validId) {
      return;
    }
    let cancelled = false;
    const key = requestKey;
    void fetchAdminReport(reportId)
      .then((report) => {
        if (!cancelled) setLoad({ key, result: { status: "ready", report } });
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        const message = hqErrorMessage(caught);
        if (caught instanceof ApiError && caught.status === 403) {
          setLoad({ key, result: { status: "forbidden", message } });
          return;
        }
        if (caught instanceof ApiError && caught.status === 404) {
          setLoad({ key, result: { status: "not_found", message } });
          return;
        }
        setLoad({ key, result: { status: "error", message } });
      });
    return () => {
      cancelled = true;
    };
  }, [reportId, requestKey, validId]);

  const status: "loading" | "not_found" | LoadResult["status"] = !validId
    ? "not_found"
    : load.key !== requestKey || load.result === null
      ? "loading"
      : load.result.status;
  const report = load.result?.status === "ready" && load.key === requestKey ? load.result.report : null;
  const errorMessage =
    load.result && load.result.status !== "ready" && load.key === requestKey
      ? load.result.message
      : !validId
        ? "That report is unavailable for this brand."
        : null;

  async function applyTransition() {
    if (!pendingStatus || !report || action.status === "pending") return;
    setAction({ status: "pending" });
    try {
      const body: HqUpdateReportBody = {
        status: pendingStatus,
        note: note.trim() ? note.trim() : null,
      };
      const updated = await updateAdminReport(report.id, body);
      setLoad({ key: requestKey, result: { status: "ready", report: updated } });
      setPendingStatus(null);
      setNote("");
      setAction({ status: "idle" });
    } catch (caught) {
      setAction({ status: "error", message: hqErrorMessage(caught) });
    }
  }

  async function applySuspend() {
    if (!report || action.status === "pending") return;
    const profileId = report.reported?.id;
    if (!profileId || confirmText !== "SUSPEND") return;
    setAction({ status: "pending" });
    try {
      await suspendAdminProfile(profileId, {
        reason: suspendReason.trim() ? suspendReason.trim() : null,
        report_id: report.id,
      });
      setSuspendOpen(false);
      setConfirmText("");
      setSuspendReason("");
      setAction({ status: "idle" });
      refresh();
    } catch (caught) {
      setAction({ status: "error", message: hqErrorMessage(caught) });
    }
  }

  async function applyReinstate() {
    if (!report || action.status === "pending") return;
    const profileId = report.reported?.id;
    if (!profileId || confirmText !== "REINSTATE") return;
    setAction({ status: "pending" });
    try {
      await reinstateAdminProfile(profileId);
      setReinstateOpen(false);
      setConfirmText("");
      setAction({ status: "idle" });
      refresh();
    } catch (caught) {
      setAction({ status: "error", message: hqErrorMessage(caught) });
    }
  }

  if (status === "loading") {
    return (
      <div className="hq-content">
        <p className="hq-loading">Loading report…</p>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="hq-content">
        <StateBanner tone="forbidden" title="Forbidden" body={errorMessage ?? ""} />
        <Link className="hq-inline-link" to="/hq/trust-safety?tab=queue">
          Back to queue
        </Link>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="hq-content">
        <UnavailableState
          badge="UNAVAILABLE"
          title="Report unavailable"
          body={errorMessage ?? "That report is unavailable for this brand."}
        />
        <Link className="hq-inline-link" to="/hq/trust-safety?tab=queue">
          Back to queue
        </Link>
      </div>
    );
  }

  if (status === "error" || !report) {
    return (
      <div className="hq-content">
        <StateBanner tone="error" title="Could not load report" body={errorMessage ?? ""} />
        <button type="button" className="hq-btn hq-btn--ghost" onClick={refresh}>
          Retry
        </button>
      </div>
    );
  }

  const allowed = TRANSITIONS[report.status];
  const evidence = evidenceRows(report.evidence);

  return (
    <div className="hq-content hq-ts-stack">
      <div className="hq-breadcrumbs">
        <Link to="/hq/trust-safety">Trust &amp; Safety</Link>
        <span className="hq-breadcrumbs__sep">/</span>
        <Link to="/hq/trust-safety?tab=queue">Queue</Link>
        <span className="hq-breadcrumbs__sep">/</span>
        <span>Report #{report.id}</span>
      </div>

      <div className="hq-member-hero">
        <div>
          <h1 className="hq-member-hero__name">Report #{report.id}</h1>
          <p className="hq-member-hero__meta">
            {humanizeKey(report.reason)} · {humanizeKey(report.target_type)}
          </p>
        </div>
        <StatusBadge
          tone={report.status === "open" || report.status === "reviewing" ? "warning" : "neutral"}
        >
          {report.status}
        </StatusBadge>
      </div>

      {action.status === "error" ? (
        <StateBanner tone="error" title="Moderation action failed" body={action.message} />
      ) : null}

      <div className="hq-grid-2">
        <MetricCard title="Report">
          <StatGroup
            items={[
              { label: "Status", value: report.status },
              { label: "Reason", value: humanizeKey(report.reason) },
              { label: "Target type", value: humanizeKey(report.target_type) },
              { label: "Created", value: formatWhen(report.created_at) },
              { label: "Updated", value: formatWhen(report.updated_at) },
              { label: "Reviewed at", value: formatWhen(report.reviewed_at) },
              {
                label: "Reviewed by admin",
                value: report.reviewed_by_admin_user_id ?? "—",
              },
            ]}
          />
          <dl className="hq-kv-grid" style={{ marginTop: 12 }}>
            <PartyLink party={report.reported} label="Reported" />
            <PartyLink party={report.reporter} label="Reporter" />
          </dl>
          <div className="hq-kv" style={{ marginTop: 12 }}>
            <dt>Reporter note</dt>
            <dd>{report.note ?? "—"}</dd>
          </div>
          <div className="hq-kv" style={{ marginTop: 8 }}>
            <dt>Resolution note</dt>
            <dd>{report.resolution_note ?? "—"}</dd>
          </div>
        </MetricCard>

        <MetricCard title="Evidence">
          {evidence.length === 0 ? (
            <p className="hq-card__subtitle">No evidence snapshot was captured for this report.</p>
          ) : (
            <dl className="hq-evidence-list">
              {evidence.map((row) => (
                <div className="hq-evidence-item" key={row.key}>
                  <dt>{row.key}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </MetricCard>
      </div>

      <MetricCard title="Moderation">
        {allowed.length === 0 ? (
          <p className="hq-card__subtitle">
            This report is in a terminal state. Status cannot be changed again.
          </p>
        ) : (
          <div className="hq-ts-actions">
            <p className="hq-card__subtitle">Change status</p>
            <div className="hq-filter-bar">
              {allowed.map((target) => (
                <button
                  key={target}
                  type="button"
                  className={`hq-chip${pendingStatus === target ? " hq-chip--active" : ""}`}
                  disabled={action.status === "pending"}
                  onClick={() => {
                    setPendingStatus(target);
                    setAction({ status: "idle" });
                  }}
                >
                  Mark {target}
                </button>
              ))}
            </div>
          </div>
        )}

        {pendingStatus ? (
          <div className="hq-confirm-panel" role="dialog" aria-label="Confirm status change">
            <p>
              Confirm changing report #{report.id} from <strong>{report.status}</strong> to{" "}
              <strong>{pendingStatus}</strong>?
            </p>
            <label className="hq-field">
              <span>Optional note</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={2000}
                disabled={action.status === "pending"}
              />
            </label>
            <div className="hq-confirm-panel__actions">
              <button
                type="button"
                className="hq-btn hq-btn--primary"
                disabled={action.status === "pending"}
                onClick={() => void applyTransition()}
              >
                {action.status === "pending" ? "Saving…" : "Confirm"}
              </button>
              <button
                type="button"
                className="hq-btn hq-btn--ghost"
                disabled={action.status === "pending"}
                onClick={() => {
                  setPendingStatus(null);
                  setNote("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div className="hq-ts-actions" style={{ marginTop: 16 }}>
          <p className="hq-card__subtitle">Account enforcement (separate from report status)</p>
          <div className="hq-filter-bar">
            <button
              type="button"
              className="hq-btn hq-btn--ghost"
              disabled={!report.reported?.id || action.status === "pending"}
              onClick={() => {
                setSuspendOpen(true);
                setReinstateOpen(false);
                setConfirmText("");
                setAction({ status: "idle" });
              }}
            >
              Suspend reported profile
            </button>
            <button
              type="button"
              className="hq-btn hq-btn--ghost"
              disabled={!report.reported?.id || action.status === "pending"}
              onClick={() => {
                setReinstateOpen(true);
                setSuspendOpen(false);
                setConfirmText("");
                setAction({ status: "idle" });
              }}
            >
              Reinstate reported profile
            </button>
          </div>
        </div>

        {suspendOpen ? (
          <div className="hq-confirm-panel" role="dialog" aria-label="Confirm suspension">
            <p>
              Type <strong>SUSPEND</strong> to confirm brand-level suspension of the reported profile.
            </p>
            <label className="hq-field">
              <span>Optional reason</span>
              <input
                value={suspendReason}
                onChange={(event) => setSuspendReason(event.target.value)}
                maxLength={500}
                disabled={action.status === "pending"}
              />
            </label>
            <label className="hq-field">
              <span>Confirmation</span>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                disabled={action.status === "pending"}
                autoComplete="off"
              />
            </label>
            <div className="hq-confirm-panel__actions">
              <button
                type="button"
                className="hq-btn hq-btn--primary"
                disabled={confirmText !== "SUSPEND" || action.status === "pending"}
                onClick={() => void applySuspend()}
              >
                {action.status === "pending" ? "Suspending…" : "Suspend"}
              </button>
              <button
                type="button"
                className="hq-btn hq-btn--ghost"
                disabled={action.status === "pending"}
                onClick={() => {
                  setSuspendOpen(false);
                  setConfirmText("");
                  setSuspendReason("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        {reinstateOpen ? (
          <div className="hq-confirm-panel" role="dialog" aria-label="Confirm reinstatement">
            <p>
              Type <strong>REINSTATE</strong> to lift the brand-level suspension.
            </p>
            <label className="hq-field">
              <span>Confirmation</span>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                disabled={action.status === "pending"}
                autoComplete="off"
              />
            </label>
            <div className="hq-confirm-panel__actions">
              <button
                type="button"
                className="hq-btn hq-btn--primary"
                disabled={confirmText !== "REINSTATE" || action.status === "pending"}
                onClick={() => void applyReinstate()}
              >
                {action.status === "pending" ? "Reinstating…" : "Reinstate"}
              </button>
              <button
                type="button"
                className="hq-btn hq-btn--ghost"
                disabled={action.status === "pending"}
                onClick={() => {
                  setReinstateOpen(false);
                  setConfirmText("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </MetricCard>
    </div>
  );
}
