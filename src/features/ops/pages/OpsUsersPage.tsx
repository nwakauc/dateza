import { useCallback, useId, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../../../lib/api/errors.ts";
import { fetchHqMemberDirectory, hqErrorMessage, lookupHqMember } from "../../../lib/hq/api.ts";
import { displayNameForMember, memberRouteKey } from "../../../lib/hq/parse.ts";
import type { HqMemberDirectoryEntry, HqMembershipStatus } from "../../../lib/hq/types.ts";
import { HqHistoryPanel } from "../../hq/components/HqHistoryPanel.tsx";
import { useHqOperator } from "../../hq/useHqOperator.ts";
import { OpsBadge, OpsBanner } from "../components/OpsPrimitives.tsx";
import { opsCan } from "../opsCapabilities.ts";
import { formatWhen, humanizeKey } from "../opsFormat.ts";

const STATUS_FILTERS: Array<{ value: "" | HqMembershipStatus; label: string }> = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "left", label: "Left" },
  { value: "deactivated", label: "Deactivated" },
];

function memberLabel(entry: HqMemberDirectoryEntry): string {
  return entry.display_name?.trim() || `Member ${entry.user_id}`;
}

function memberPath(entry: HqMemberDirectoryEntry): string | null {
  return entry.profile_id ? `/ops/users/${encodeURIComponent(entry.profile_id)}` : null;
}

export default function OpsUsersPage() {
  const navigate = useNavigate();
  const { operator } = useHqOperator();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputId = useId();
  const urlQuery = searchParams.get("q") ?? "";
  const statusFilter = (searchParams.get("status") ?? "") as "" | HqMembershipStatus;
  const [query, setQuery] = useState(urlQuery);
  const [status, setStatus] = useState<"idle" | "searching" | "not_found" | "forbidden" | "error">("idle");
  const [error, setError] = useState<string>();
  const pendingRef = useRef(false);

  const canReadReports = opsCan(operator, "admin.reports.read");
  const canModeratePhotos = opsCan(operator, "admin.profile_photos.moderate");
  const canManageEnforcement = opsCan(operator, "admin.enforcements.manage");

  const loadDirectoryPage = useCallback(
    async (cursor: string | null) => {
      const page = await fetchHqMemberDirectory({
        status: statusFilter || null,
        cursor,
        limit: 25,
      });
      return { rows: page.members, next_cursor: page.next_cursor };
    },
    [statusFilter],
  );

  const runLookup = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || pendingRef.current) return;
      pendingRef.current = true;
      setStatus("searching");
      setError(undefined);
      setSearchParams(
        (params) => {
          const next = new URLSearchParams(params);
          next.set("q", trimmed);
          return next;
        },
        { replace: true },
      );

      try {
        const result = await lookupHqMember(trimmed);
        if (!result.found) {
          setStatus("not_found");
          return;
        }
        const key = memberRouteKey(result.member.member, trimmed);
        void navigate(`/ops/users/${encodeURIComponent(key)}`, {
          state: { displayName: displayNameForMember(result.member) },
        });
      } catch (caught) {
        if (caught instanceof ApiError && caught.status === 403) {
          setStatus("forbidden");
          setError(hqErrorMessage(caught));
          return;
        }
        setStatus("error");
        setError(hqErrorMessage(caught));
      } finally {
        pendingRef.current = false;
      }
    },
    [navigate, setSearchParams],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void runLookup(query);
  }

  function setFilter(next: "" | HqMembershipStatus) {
    setSearchParams(
      (params) => {
        const updated = new URLSearchParams(params);
        if (!next) updated.delete("status");
        else updated.set("status", next);
        return updated;
      },
      { replace: true },
    );
  }

  return (
    <div className="ops-stack">
      <section className="ops-card">
        <h2 style={{ marginTop: 0 }}>Find a member</h2>
        <p className="ops-muted">
          Exact lookup by email, phone, or profile public id. The directory below is a safe brand
          summary — contact identifiers stay behind Member 360.
        </p>
        <form onSubmit={onSubmit}>
          <label className="ops-field" htmlFor={inputId}>
            Member lookup
            <input
              id={inputId}
              key={urlQuery}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="email, phone, or public id"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="ops-btn ops-btn--primary" disabled={status === "searching"}>
            {status === "searching" ? "Searching…" : "Look up"}
          </button>
        </form>
        {status === "not_found" ? (
          <OpsBanner
            tone="neutral"
            title="No member found"
            body="Unknown and cross-brand lookups both appear as not found."
          />
        ) : null}
        {status === "forbidden" || status === "error" ? (
          <OpsBanner tone="forbidden" title="Lookup failed" body={error ?? "Try again."} />
        ) : null}
      </section>

      <section className="ops-card">
        <h2 style={{ marginTop: 0 }}>Brand members</h2>
        <p className="ops-muted">Newest signups first on this brand.</p>

        <div className="ops-chips" role="toolbar" aria-label="Membership status filters">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className="ops-chip"
              aria-pressed={statusFilter === filter.value}
              onClick={() => setFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <HqHistoryPanel
          key={statusFilter || "all"}
          loadPage={loadDirectoryPage}
          columns={[
            { key: "member", header: "Member" },
            { key: "membership", header: "Membership" },
            { key: "joined", header: "Joined" },
            { key: "signals", header: "Signals" },
            { key: "actions", header: "Actions" },
          ]}
          mapRow={(entry: HqMemberDirectoryEntry) => {
            const path = memberPath(entry);
            const name = memberLabel(entry);
            return {
              member: path ? (
                <Link className="ops-inline-link" to={path}>
                  {name}
                </Link>
              ) : (
                name
              ),
              membership: (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <OpsBadge tone={entry.membership_status === "active" ? "success" : "neutral"}>
                    {humanizeKey(entry.membership_status)}
                  </OpsBadge>
                  {entry.profile_status ? (
                    <OpsBadge tone={entry.profile_status === "suspended" ? "danger" : "neutral"}>
                      {humanizeKey(entry.profile_status)}
                    </OpsBadge>
                  ) : null}
                </div>
              ),
              joined: formatWhen(entry.joined_at),
              signals: (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {entry.reports_received_count > 0 ? (
                    <OpsBadge tone="warning">{entry.reports_received_count} reports</OpsBadge>
                  ) : null}
                  {entry.pending_photo_count > 0 ? (
                    <OpsBadge tone="accent">{entry.pending_photo_count} photos</OpsBadge>
                  ) : null}
                  {entry.active_enforcement ? <OpsBadge tone="danger">Enforced</OpsBadge> : null}
                  {!entry.reports_received_count &&
                  !entry.pending_photo_count &&
                  !entry.active_enforcement ? (
                    <span className="ops-muted">—</span>
                  ) : null}
                </div>
              ),
              actions: path ? (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Link className="ops-btn ops-btn--primary" to={path}>
                    Member 360
                  </Link>
                  {canReadReports && entry.reports_received_count > 0 ? (
                    <Link className="ops-btn" to={path}>
                      Reports
                    </Link>
                  ) : null}
                  {canModeratePhotos && entry.pending_photo_count > 0 ? (
                    <Link className="ops-btn" to="/ops/photos">
                      Photos
                    </Link>
                  ) : null}
                  {canManageEnforcement ? (
                    <Link className="ops-btn" to={path}>
                      {entry.profile_status === "suspended" || entry.active_enforcement
                        ? "Reinstate"
                        : "Suspend"}
                    </Link>
                  ) : null}
                </div>
              ) : (
                <span className="ops-muted">No profile yet</span>
              ),
            };
          }}
          emptyLabel="No members match this filter on the current brand."
          endLabel="End of directory for this filter."
        />
      </section>
    </div>
  );
}
