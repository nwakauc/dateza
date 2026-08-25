import { CompassIcon, HeartIcon, ShieldCheckIcon } from "../shell/icons.tsx";

const ITEMS = [
  { Icon: CompassIcon, title: "Smart picks", body: "Curated for you" },
  { Icon: ShieldCheckIcon, title: "Verified members", body: "Real people, real connections" },
  { Icon: HeartIcon, title: "Designed for you", body: "Better matches, better dates" },
] as const;

export function DiscoverValueStrip() {
  return (
    <div className="discover-value-strip">
      {ITEMS.map(({ Icon, title, body }) => (
        <div className="discover-value-strip__item" key={title}>
          <span className="discover-value-strip__icon">
            <Icon className="discover-value-strip__icon-svg" />
          </span>
          <div>
            <strong>{title}</strong>
            <span>{body}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
