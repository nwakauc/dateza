import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../../../lib/api/errors.ts";
import { hqErrorMessage, lookupHqMember } from "../../../lib/hq/api.ts";
import { displayNameForMember, memberRouteKey } from "../../../lib/hq/parse.ts";
import { useHqBrand } from "../useHqBrand.ts";
import { MetricCard, StateBanner, StatusBadge } from "../components/HqPrimitives.tsx";

type SearchStatus = "idle" | "searching" | "not_found" | "forbidden" | "error";

export default function MemberSearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { brandName, status: brandStatus } = useHqBrand();
  const inputId = useId();
  const errorId = useId();
  const urlQuery = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState<string | null>(null);
  const query = draft ?? urlQuery;
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | undefined>();
  const autoRanFor = useRef<string | null>(null);
  const pendingRef = useRef(false);

  const runLookup = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || pendingRef.current) {
        return;
      }
      pendingRef.current = true;
      setStatus("searching");
      setError(undefined);

      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("q", trimmed);
      nextParams.delete("auto");
      nextParams.delete("run");
      setSearchParams(nextParams, { replace: true });
      setDraft(null);

      try {
        const result = await lookupHqMember(trimmed);
        if (!result.found) {
          setStatus("not_found");
          return;
        }
        const key = memberRouteKey(result.member.member, trimmed);
        void navigate(`/hq/members/${encodeURIComponent(key)}`, {
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
    [navigate, searchParams, setSearchParams],
  );

  useEffect(() => {
    const q = searchParams.get("q")?.trim();
    const shouldRun = searchParams.get("run") === "1" || searchParams.get("auto") === "1";
    if (!q || !shouldRun || brandStatus === "loading") {
      return;
    }
    if (autoRanFor.current === q) {
      return;
    }
    autoRanFor.current = q;
    void runLookup(q);
  }, [brandStatus, runLookup, searchParams]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runLookup(query);
  }

  const pending = status === "searching";

  return (
    <div className="hq-content">
      <MetricCard title="Member lookup" action={<StatusBadge tone="accent">Phase 1</StatusBadge>}>
        <div className="hq-search-panel">
          <p className="hq-card__subtitle" style={{ marginBottom: 12 }}>
            Exact lookup by email, phone, or profile public id on{" "}
            <strong>{brandName ?? "this brand"}</strong>. The API never reveals whether a match
            exists on another brand.
          </p>
          <form className="hq-search-form" onSubmit={onSubmit}>
            <label className="visually-hidden" htmlFor={inputId}>
              Member lookup
            </label>
            <input
              id={inputId}
              name="q"
              value={query}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="email@example.com, +27…, or profile UUID"
              autoComplete="off"
              spellCheck={false}
              disabled={pending}
              aria-invalid={status === "error" || status === "forbidden" ? true : undefined}
              aria-describedby={error ? errorId : undefined}
            />
            <button type="submit" className="hq-btn hq-btn--primary" disabled={pending || !query.trim()}>
              {pending ? "Searching…" : "Look up"}
            </button>
          </form>

          {status === "not_found" ? (
            <div style={{ marginTop: 12 }}>
              <StateBanner
                tone="neutral"
                title="No member found"
                body="Nothing matched that identifier for this brand. Unknown and unauthorized-brand matches look the same."
              />
            </div>
          ) : null}

          {status === "forbidden" ? (
            <div id={errorId} style={{ marginTop: 12 }}>
              <StateBanner
                tone="forbidden"
                title="Forbidden"
                body={error ?? "You are not an admin for this brand."}
              />
            </div>
          ) : null}

          {status === "error" ? (
            <div id={errorId} style={{ marginTop: 12 }}>
              <StateBanner tone="error" title="Lookup failed" body={error ?? "Try again."} />
            </div>
          ) : null}

          <p className="hq-card__subtitle" style={{ marginTop: 14 }}>
            Tip: <kbd className="hq-control">⌘K</kbd> opens search from anywhere in HQ.{" "}
            <Link to="/hq">Command Centre</Link>
          </p>
        </div>
      </MetricCard>
    </div>
  );
}
