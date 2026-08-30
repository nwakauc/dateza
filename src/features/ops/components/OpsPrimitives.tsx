import type { ReactNode } from "react";

export function OpsBadge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "warning" | "success" | "danger" | "accent";
  children: ReactNode;
}) {
  return <span className={`ops-badge ops-badge--${tone}`}>{children}</span>;
}

export function OpsBanner({
  tone,
  title,
  body,
  action,
}: {
  tone: "error" | "forbidden" | "neutral" | "warning";
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className={`ops-banner ops-banner--${tone}`} role="status">
      <strong>{title}</strong>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function OpsMetricCard({
  label,
  value,
  hint,
  badge,
  unavailable,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  badge?: string;
  /** When set, renders an honest unavailable card instead of a fabricated number. */
  unavailable?: string;
}) {
  if (unavailable) {
    return (
      <article className="ops-metric ops-metric--unavailable">
        <div className="ops-metric__head">
          <p className="ops-metric__label">{label}</p>
          <OpsBadge tone="neutral">NOT CONFIGURED</OpsBadge>
        </div>
        <p className="ops-metric__value">—</p>
        <p className="ops-metric__hint">{unavailable}</p>
      </article>
    );
  }

  return (
    <article className="ops-metric">
      <div className="ops-metric__head">
        <p className="ops-metric__label">{label}</p>
        {badge ? <OpsBadge tone="neutral">{badge}</OpsBadge> : null}
      </div>
      <p className="ops-metric__value">{value}</p>
      {hint ? <p className="ops-metric__hint">{hint}</p> : null}
    </article>
  );
}

export function OpsEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="ops-empty">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

export function OpsDashboardSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="ops-dashboard-section">
      <div className="ops-dashboard-section__head">
        <h2>{title}</h2>
        {description ? <p className="ops-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function OpsGenderSplitPlaceholder({ message }: { message: string }) {
  return (
    <div className="ops-gender-chart" aria-label="Gender split unavailable">
      <div className="ops-gender-chart__ring" aria-hidden="true">
        <span>—</span>
      </div>
      <p className="ops-muted">{message}</p>
    </div>
  );
}

export function OpsTable({
  columns,
  rows,
  empty,
}: {
  columns: Array<{ key: string; header: string }>;
  rows: Array<Record<string, ReactNode>>;
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="ops-muted">{empty}</p>;
  }
  return (
    <div className="ops-table-wrap">
      <table className="ops-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
