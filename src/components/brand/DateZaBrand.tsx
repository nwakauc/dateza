type Size = "sm" | "md" | "lg";

type Props = {
  size?: Size;
  className?: string;
};

const HEART_PATH =
  "M15 26S4 19.3 4 11.9C4 7.5 7.4 4.6 11 4.6c1.7 0 3.2.7 4 1.8.8-1.1 2.3-1.8 4-1.8 3.6 0 7 2.9 7 7.3C26 19.3 15 26 15 26z";

const HEART_PX: Record<Size, number> = {
  sm: 20,
  md: 24,
  lg: 28,
};

const BURST_HEARTS = ["dateza-brand__burst--1", "dateza-brand__burst--2", "dateza-brand__burst--3", "dateza-brand__burst--4", "dateza-brand__burst--5", "dateza-brand__burst--6"] as const;

function classes(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function BurstHeart({ className }: { className: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 30 30" className="dateza-brand__burst-icon" focusable="false">
        <path d={HEART_PATH} fill="currentColor" />
      </svg>
    </span>
  );
}

export function DateZaBrand({ size = "md", className }: Props) {
  const heartPx = HEART_PX[size];

  return (
    <span className={classes("dateza-brand", `dateza-brand--${size}`, className)}>
      <span className="dateza-brand__heart" aria-hidden="true">
        <svg width={heartPx} height={heartPx} viewBox="0 0 30 30" className="dateza-brand__heart-icon">
          <path d={HEART_PATH} fill="currentColor" />
        </svg>
        {BURST_HEARTS.map((burstClass) => (
          <BurstHeart key={burstClass} className={classes("dateza-brand__burst", burstClass)} />
        ))}
      </span>
      <span className="dateza-brand__wordmark" aria-hidden="true">
        <span className="dateza-brand__date">Date</span>
        <span className="dateza-brand__za">ZA</span>
      </span>
    </span>
  );
}
