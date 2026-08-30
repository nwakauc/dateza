import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchAdminReports } from "../../../lib/hq/api.ts";
import type { HqAdminReport, HqReportStatus } from "../../../lib/hq/types.ts";
import { HqHistoryPanel } from "../../hq/components/HqHistoryPanel.tsx";
import { OpsBadge } from "../components/OpsPrimitives.tsx";
import { formatWhen, humanizeKey } from "../opsFormat.ts";

const FILTERS: Array<{ value: "" | HqReportStatus; label: string }> = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "actioned", label: "Actioned" },
  { value: "dismissed", label: "Dismissed" },
];

export default function OpsReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = (searchParams.get("status") ?? "") as "" | HqReportStatus;

  const loadPage = useCallback(
    async (cursor: string | null) => {
      const page = await fetchAdminReports({
        status: statusFilter || null,
        cursor,
        limit: 25,
      });
      return { rows: page.reports, next_cursor: page.next_cursor };
    },
    [statusFilter],
  );

  function setFilter(next: "" | HqReportStatus) {
    const params = new URLSearchParams(searchParams);
    if (!next) params.delete("status");
    else params.set("status", next);
    setSearchParams(params, { replace: true });
  }

  return (
    <div>
      <div className="ops-chips" role="toolbar" aria-label="Report status filters">
        {FILTERS.map((filter) => (
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
        loadPage={loadPage}
        columns={[
          { key: "id", header: "Report" },
          { key: "status", header: "Status" },
          { key: "reason", header: "Reason" },
          { key: "target", header: "Target" },
          { key: "created", header: "Created" },
        ]}
        mapRow={(row: HqAdminReport) => ({
          id: (
            <Link className="ops-inline-link" to={`/ops/reports/${row.id}`}>
              #{row.id}
            </Link>
          ),
          status: <OpsBadge tone={row.status === "open" || row.status === "reviewing" ? "warning" : "neutral"}>{row.status}</OpsBadge>,
          reason: humanizeKey(row.reason),
          target: humanizeKey(row.target_type),
          created: formatWhen(row.created_at),
        })}
        emptyLabel="No reports in this queue filter."
        endLabel="End of queue for this filter."
      />
    </div>
  );
}
