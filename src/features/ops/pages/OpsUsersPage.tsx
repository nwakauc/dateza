import { useCallback, useId, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../../../lib/api/errors.ts";
import { hqErrorMessage, lookupHqMember } from "../../../lib/hq/api.ts";
import { displayNameForMember, memberRouteKey } from "../../../lib/hq/parse.ts";
import { OpsBanner, OpsEmpty, OpsMetricCard } from "../components/OpsPrimitives.tsx";

export default function OpsUsersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputId = useId();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  const [status, setStatus] = useState<"idle" | "searching" | "not_found" | "forbidden" | "error">("idle");
  const [error, setError] = useState<string>();
  const pendingRef = useRef(false);

  const runLookup = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || pendingRef.current) return;
      pendingRef.current = true;
      setStatus("searching");
      setError(undefined);
      setSearchParams({ q: trimmed }, { replace: true });

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

  return (
    <div className="ops-grid-2">
      <section className="ops-card">
        <h2 style={{ marginTop: 0 }}>Find a member</h2>
        <p className="ops-muted">Search by email, phone, or profile public id on this brand.</p>
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
          <OpsBanner tone="neutral" title="No member found" body="Unknown and cross-brand lookups both appear as not found." />
        ) : null}
        {status === "forbidden" || status === "error" ? (
          <OpsBanner tone="forbidden" title="Lookup failed" body={error ?? "Try again."} />
        ) : null}
      </section>

      <section className="ops-card">
        <OpsMetricCard label="User directory" value="Not configured" badge="NOT AVAILABLE" />
        <OpsEmpty
          title="User directory not yet available"
          body="D8N does not expose a brand-scoped paginated member list endpoint yet. This page stays search-first until a verified contract exists."
        />
        <p className="ops-muted">
          Requested future endpoint: brand-scoped operator member directory with cursor pagination
          and capability-gated fields — do not invent schema client-side.
        </p>
        <Link className="ops-inline-link" to="/ops">
          Back to dashboard
        </Link>
      </section>
    </div>
  );
}
