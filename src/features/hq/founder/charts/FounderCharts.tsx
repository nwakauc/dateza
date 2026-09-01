import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

export type { ChartSeries } from "./founderChartTypes.ts";

const PULSE_CHART_HEIGHT = 112;
const DONUT_SIZE = 80;
const SPARKLINE_HEIGHT = 28;

type DonutSegment = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type PulseSeries = {
  key: string;
  label: string;
  color: string;
  points: Array<{ window: string; value: number | null; unavailable?: boolean }>;
};

export function FounderSparkline({
  values,
  color,
  ariaLabel,
}: {
  values: Array<number | null>;
  color: string;
  ariaLabel: string;
}) {
  const numeric = values.map((value) => (value === null ? 0 : value));
  const max = Math.max(1, ...numeric);
  const width = 64;
  const height = SPARKLINE_HEIGHT;
  const step = numeric.length > 1 ? width / (numeric.length - 1) : width;
  const points = numeric
    .map((value, index) => {
      const x = index * step;
      const y = height - 4 - (value / max) * (height - 8);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      className="founder-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function FounderPulseAreaChart({
  series,
  ariaLabel,
}: {
  series: PulseSeries[];
  ariaLabel: string;
}) {
  const windowLabels = series[0]?.points.map((point) => point.window) ?? [];
  const data = windowLabels.map((window, index) => {
    const row: Record<string, string | number> = { window };
    for (const item of series) {
      const point = item.points[index];
      row[item.key] =
        point?.unavailable || point?.value === null ? 0 : (point?.value ?? 0);
    }
    return row;
  });

  return (
    <figure className="founder-chart founder-chart--pulse-area" aria-label={ariaLabel}>
      <div className="founder-chart__plot" style={{ height: PULSE_CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 8, left: -28, bottom: 0 }}>
            <XAxis
              dataKey="window"
              tick={{ fontSize: 10, fill: "var(--founder-text-faint)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, "auto"]} />
            {series.map((item) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                fill={item.color}
                fillOpacity={0.1}
                strokeWidth={2}
                isAnimationActive={false}
                dot={{ r: 2.5, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="visually-hidden">
        {series
          .map((item) =>
            `${item.label}: ${item.points.map((point) => `${point.window} ${point.value ?? "—"}`).join(", ")}`,
          )
          .join("; ")}
      </figcaption>
    </figure>
  );
}

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

  return (
    <figure className="founder-chart founder-chart--donut" aria-label={ariaLabel}>
      <div className="founder-chart__donut-layout">
        <div
          className="founder-chart__donut-plot"
          style={{ width: DONUT_SIZE, height: DONUT_SIZE }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                dataKey="value"
                nameKey="label"
                innerRadius={24}
                outerRadius={36}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {segments.map((segment) => (
                  <Cell key={segment.key} fill={segment.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="founder-chart__donut-center-label" aria-hidden="true">
            <strong>{centerValue}</strong>
            <span>{totalLabel}</span>
          </div>
        </div>
        <ul className="founder-chart__legend">
          {segments.map((segment) => {
            const pct = total > 0 ? ((segment.value / total) * 100).toFixed(1) : "0";
            return (
              <li key={segment.key}>
                <span className="founder-chart__swatch" style={{ background: segment.color }} />
                <span>{segment.label}</span>
                <strong>
                  {pct}%
                </strong>
              </li>
            );
          })}
        </ul>
      </div>
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

export function FounderChartSkeleton({ variant = "bars" }: { variant?: "bars" | "donut" | "area" }) {
  return (
    <div
      className={`founder-chart-skeleton founder-chart-skeleton--${variant}`}
      aria-hidden="true"
    />
  );
}
