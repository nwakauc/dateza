import { Link } from "react-router-dom";
import type { HqSecurityAlertList } from "../../../lib/hq/types.ts";
import { formatWhenShort } from "../commandCentreMetric.ts";

function humanizeKey(key: string): string {
  return key.replace(/_/g, " ");
}

export function FounderSecurityAlerts({
  alerts,
  error,
}: {
  alerts: HqSecurityAlertList | null;
  error: string | null;
}) {
  if (error) {
    return (
      <section className="founder-panel founder-panel--compact" aria-labelledby="founder-alerts-title">
        <h2 id="founder-alerts-title" className="founder-panel__title">
          Security alerts
        </h2>
        <p className="founder-panel__error">{error}</p>
      </section>
    );
  }

  const rows = alerts?.alerts ?? [];

  return (
    <section className="founder-panel founder-panel--compact" aria-labelledby="founder-alerts-title">
      <header className="founder-panel__header">
        <h2 id="founder-alerts-title" className="founder-panel__title">
          Security alerts
        </h2>
        <Link className="founder-link-arrow" to="/hq/alerts">
          View all
        </Link>
      </header>
      {rows.length === 0 ? (
        <p className="founder-panel__subtitle">No recent security alerts on this brand.</p>
      ) : (
        <ul className="founder-alerts-list">
          {rows.slice(0, 5).map((row) => (
            <li key={`${row.event_type}-${row.created_at}`}>
              <span className={`founder-alerts-list__severity founder-alerts-list__severity--${row.severity}`}>
                {row.severity}
              </span>
              <span className="founder-alerts-list__event">{humanizeKey(row.event_type)}</span>
              <time className="founder-alerts-list__when">{formatWhenShort(row.created_at)}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
