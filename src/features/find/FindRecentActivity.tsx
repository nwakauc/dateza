import { Link } from "react-router-dom";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";

type Props = {
  notifications: ProductNotification[];
  loading: boolean;
  unavailable: boolean;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function initialFromTitle(title: string): string {
  const letter = title.trim()[0];
  return letter ? letter.toUpperCase() : "•";
}

export function FindRecentActivity({ notifications, loading, unavailable }: Props) {
  return (
    <section className="find-rail-card" aria-label="Recent activity">
      <h2 className="find-rail-card__title">Recent activity</h2>
      {loading ? <p className="find-rail-card__body">Checking notices…</p> : null}
      {!loading && unavailable ? (
        <p className="find-rail-card__body">Activity isn’t available right now.</p>
      ) : null}
      {!loading && !unavailable && notifications.length === 0 ? (
        <p className="find-rail-card__body">No notices yet. Profile views aren’t on DateZA yet.</p>
      ) : null}
      {!loading && notifications.length > 0 ? (
        <ul className="find-activity">
          {notifications.slice(0, 4).map((item) => (
            <li key={item.id}>
              <span className="find-activity__avatar" aria-hidden="true">
                {initialFromTitle(item.title)}
              </span>
              <div>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </div>
              <time dateTime={item.created_at}>{relativeTime(item.created_at)}</time>
            </li>
          ))}
        </ul>
      ) : null}
      <Link className="find-rail-card__link" to="/notifications">
        See all activity →
      </Link>
    </section>
  );
}
