import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHqSecurityAlerts, hqErrorMessage } from "../../../lib/hq/api.ts";
import { canReadSecurityAlerts } from "../../../lib/hq/enforcementAccess.ts";
import type { HqSecurityAlertList } from "../../../lib/hq/types.ts";
import { DataTable, MetricCard, StateBanner, StatusBadge } from "../components/HqPrimitives.tsx";
import { useHqOperator } from "../useHqOperator.ts";

function formatWhen(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replace("T", " ").replace(/\.\d+Z$/, "Z");
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, " ");
}

function TableSkeleton() {
  return (
    <div className="hq-directory-skeleton" aria-busy="true" aria-label="Loading alerts">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="hq-directory-skeleton__row" />
      ))}
    </div>
  );
}

function AlertsTable({ limit }: { limit: number }) {
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string>();
  const [alerts, setAlerts] = useState<HqSecurityAlertList | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchHqSecurityAlerts({ limit })
      .then((page) => {
        if (cancelled) return;
        setAlerts(page);
        setLoad("ready");
      })
      .catch((caught) => {
        if (cancelled) return;
        setMessage(hqErrorMessage(caught));
        setLoad("error");
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (load === "loading") return <TableSkeleton />;
  if (load === "error") {
    return <StateBanner tone="error" title="Could not load alerts" body={message ?? "Try again."} />;
  }

  return (
    <DataTable
      columns={[
        { key: "event", header: "Event" },
        { key: "severity", header: "Severity" },
        { key: "ip", header: "IP" },
        { key: "when", header: "When" },
      ]}
      rows={(alerts?.alerts ?? []).map((row) => ({
        event: humanizeKey(row.event_type),
        severity: row.severity,
        ip: row.ip_address ?? "—",
        when: formatWhen(row.created_at),
      }))}
      empty="No security alerts on this brand."
    />
  );
}

export default function AlertsPage() {
  const { operator } = useHqOperator();
  const canAlerts = canReadSecurityAlerts(operator);

  if (!operator) {
    return null;
  }

  if (!canAlerts) {
    return (
      <div className="hq-content">
        <StateBanner
          tone="forbidden"
          title="Security alerts not enabled"
          body="Your operator role does not include hq.security_alerts.read. Backend authorization is authoritative — ask an admin if you need this access."
        />
      </div>
    );
  }

  return (
    <div className="hq-content hq-content--stack">
      <MetricCard
        title="Security alerts"
        action={<StatusBadge tone="accent">Brand scope</StatusBadge>}
      >
        <p className="hq-card__subtitle" style={{ marginBottom: 12 }}>
          Warning, high, and critical security events for the current brand. Read-only — no
          acknowledgement workflow exists yet.
        </p>

        <AlertsTable limit={50} />

        <p className="hq-card__subtitle" style={{ marginTop: 12 }}>
          Member-scoped investigation lives in{" "}
          <Link className="hq-inline-link" to="/hq/members">
            Member 360
          </Link>{" "}
          security history. Operational moderation is in{" "}
          <Link className="hq-inline-link" to="/hq/trust-safety">
            Trust &amp; Safety
          </Link>
          .
        </p>
      </MetricCard>
    </div>
  );
}
