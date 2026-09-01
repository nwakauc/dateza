import { useMemo } from "react";

export type ChartSeries = {
  key: string;
  label: string;
  value: number | null;
  color: string;
  unavailable?: boolean;
};

type GroupedBarChartProps = {
  series: ChartSeries[];
  ariaLabel: string;
  height?: number;
};

export function FounderGroupedBarChart({
  series,
  ariaLabel,
  height = 220,
}: GroupedBarChartProps) {
  const max = useMemo(() => {
    const values = series.map((item) => item.value ?? 0);
    return Math.max(1, ...values);
  }, [series]);

  const width = 100;
  const barWidth = Math.min(18, (width - 12) / Math.max(series.length, 1) - 4);

  return (
    <figure className="founder-chart founder-chart--bars" aria-label={ariaLabel}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-hidden="true"
        preserveAspectRatio="none"
        className="founder-chart__svg"
      >
        {series.map((item, index) => {
          const x = 8 + index * (barWidth + 8);
          const value = item.value ?? 0;
          const barHeight = item.unavailable || item.value === null ? 4 : (value / max) * (height - 48);
          const y = height - 28 - barHeight;
          return (
            <g key={item.key}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={3}
                fill={item.unavailable || item.value === null ? "#d4d4d4" : item.color}
                className="founder-chart__bar"
              />
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                className="founder-chart__axis-label"
              >
                {item.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="founder-chart__value-label"
              >
                {item.unavailable ? "—" : item.value === null ? "—" : item.value}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="visually-hidden">
        {series
          .map((item) => `${item.label}: ${item.unavailable ? "unavailable" : item.value ?? "no data"}`)
          .join(", ")}
      </figcaption>
    </figure>
  );
}

type DonutSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export function FounderDonutChart({
  segments,
  totalLabel,
  centerValue,
  ariaLabel,
}: {
  segments: DonutSegment[];
  totalLabel: string;
  centerValue: string;
  ariaLabel: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = 42;
  const stroke = 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <figure className="founder-chart founder-chart--donut" aria-label={ariaLabel}>
      <svg viewBox="0 0 120 120" role="img" aria-hidden="true" className="founder-chart__svg">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#eceae6" strokeWidth={stroke} />
        <g transform="rotate(-90 60 60)">
          {total > 0
            ? segments.map((segment) => {
                const fraction = segment.value / total;
                const dash = fraction * circumference;
                const circle = (
                  <circle
                    key={segment.key}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                  />
                );
                offset += dash;
                return circle;
              })
            : null}
        </g>
        <text x="60" y="56" textAnchor="middle" className="founder-chart__donut-center">
          {centerValue}
        </text>
        <text x="60" y="72" textAnchor="middle" className="founder-chart__donut-sub">
          {totalLabel}
        </text>
      </svg>
      <ul className="founder-chart__legend">
        {segments.map((segment) => (
          <li key={segment.key}>
            <span className="founder-chart__swatch" style={{ background: segment.color }} />
            <span>{segment.label}</span>
            <strong>{segment.value.toLocaleString("en-ZA")}</strong>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function FounderHorizontalBars({
  rows,
  ariaLabel,
}: {
  rows: Array<{ key: string; label: string; value: number | null; max: number; tone?: string }>;
  ariaLabel: string;
}) {
  return (
    <figure className="founder-chart founder-chart--horizontal" aria-label={ariaLabel}>
      <ul className="founder-hbars">
        {rows.map((row) => {
          const width =
            row.value === null || row.max <= 0 ? 0 : Math.max(4, (row.value / row.max) * 100);
          return (
            <li key={row.key} className="founder-hbars__row">
              <span className="founder-hbars__label">{row.label}</span>
              <span className="founder-hbars__track">
                <span
                  className="founder-hbars__fill"
                  style={{
                    width: `${width}%`,
                    background: row.tone ?? "var(--founder-accent-blue)",
                  }}
                />
              </span>
              <span className="founder-hbars__value">
                {row.value === null ? "—" : row.value.toLocaleString("en-ZA")}
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export function FounderChartSkeleton({ variant = "bars" }: { variant?: "bars" | "donut" }) {
  return (
    <div
      className={`founder-chart-skeleton founder-chart-skeleton--${variant}`}
      aria-hidden="true"
    />
  );
}
