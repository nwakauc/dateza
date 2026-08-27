import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../../lib/api/notifications.ts";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import {
  BellIcon,
  EyeIcon,
  GearIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SlidersIcon,
  UserIcon,
  UsersIcon,
} from "../shell/icons.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { resolveNotificationDestination } from "./notificationDestination.ts";

type NotificationGroup = {
  label: "Today" | "Yesterday" | "Earlier";
  items: ProductNotification[];
};

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

function readableTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  const elapsedMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (Math.abs(elapsedMinutes) < 60) return relativeTime.format(elapsedMinutes, "minute");
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (Math.abs(elapsedHours) < 24) return relativeTime.format(elapsedHours, "hour");
  const elapsedDays = Math.round(elapsedHours / 24);
  if (Math.abs(elapsedDays) < 7) return relativeTime.format(elapsedDays, "day");
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function dayDifference(value: string): number {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 2;
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  return Math.round((localToday - localDate) / 86400000);
}

function groupNotifications(items: ProductNotification[]): NotificationGroup[] {
  const groups: Record<NotificationGroup["label"], ProductNotification[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };
  for (const item of items) {
    const difference = dayDifference(item.created_at);
    groups[difference <= 0 ? "Today" : difference === 1 ? "Yesterday" : "Earlier"].push(item);
  }
  return (Object.entries(groups) as [NotificationGroup["label"], ProductNotification[]][])
    .filter(([, groupedItems]) => groupedItems.length > 0)
    .map(([label, groupedItems]) => ({ label, items: groupedItems }));
}

export default function NotificationsPage() {
  const account = useOwnAccount();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProductNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const load = useCallback(() => {
    void listNotifications()
      .then((result) => {
        setItems(result.notifications);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  function retry() { setError(false); setLoading(true); load(); }

  useEffect(() => {
    document.title = "Notifications — DateZA";
    load();
    return () => { document.title = "DateZA — Meet someone who chooses you."; };
  }, [load]);

  async function openNotification(item: ProductNotification) {
    if (openingId) return;
    setOpeningId(item.id);
    setOpenError(null);
    try {
      if (!item.read_at) {
        const updated = await markNotificationRead(item.id);
        setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
        account.refresh();
      }
      const destination = resolveNotificationDestination(item);
      if (destination) navigate(destination);
    } catch {
      setOpenError("We couldn’t open that update. Try again.");
    } finally {
      setOpeningId(null);
    }
  }

  async function readAll() {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
      account.refresh();
    } catch { /* Keep unread state unchanged. */ } finally { setMarkingAll(false); }
  }

  const hasUnread = items.some((item) => item.read_at === null);
  const groups = groupNotifications(items);
  return (
    <div className="shell-page notifications-page">
      <aside className="notifications-settings-nav" aria-label="Settings">
        <h2>Settings</h2>
        <Link to="/settings#account"><UserIcon /><span>Account</span></Link>
        <Link to="/settings#privacy"><ShieldIcon /><span>Privacy & safety</span></Link>
        <Link className="notifications-settings-nav__active" to="/notifications" aria-current="page"><BellIcon /><span>Notifications</span></Link>
        <Link to="/settings#preferences"><SlidersIcon /><span>Preferences</span></Link>
        <Link to="/settings#blocked"><UsersIcon /><span>Blocked users</span></Link>
        <Link to="/settings#verification"><ShieldCheckIcon /><span>Verification</span></Link>
        <Link to="/settings#payments"><GearIcon /><span>Payment & plans</span></Link>
        <Link to="/settings#data"><EyeIcon /><span>Data & permissions</span></Link>
        <Link to="/settings#help"><ShieldIcon /><span>Help & support</span></Link>
        <Link to="/settings#about"><GearIcon /><span>About DateZA</span></Link>
      </aside>
      <div className="notifications-content">
        <div className="shell-page__header shell-page__header--with-action">
          <div><h1 className="shell-page__title">Notifications</h1><p className="shell-page__subtitle">Stay in the loop with what’s happening on DateZA.</p></div>
          {hasUnread ? <button className="shell-text-action" type="button" onClick={() => void readAll()} disabled={markingAll}>{markingAll ? "Marking read…" : "Mark all read"}</button> : null}
        </div>
        {openError ? <p className="shell-inline-error" role="alert">{openError}</p> : null}
        <div className="notifications-layout">
        <section className="notifications-feed" aria-label="Notification activity">
          {loading ? (
            <div className="notification-skeletons" aria-live="polite" aria-label="Loading notifications">
              {[0, 1, 2, 3].map((item) => <div className="notification-skeleton" key={item}><span /><div><i /><i /></div></div>)}
            </div>
          ) : null}
          {error ? <div className="shell-empty"><BellIcon className="shell-empty__icon" /><p className="shell-empty__title">We couldn’t load your notifications</p><p className="shell-empty__body">Check your connection, then try again.</p><button className="shell-primary-action" type="button" onClick={retry}>Try again</button></div> : null}
          {!loading && !error && items.length === 0 ? <div className="shell-empty"><BellIcon className="shell-empty__icon" /><p className="shell-empty__title">You’re all caught up</p><p className="shell-empty__body">New DateZA updates will appear here.</p><Link className="shell-primary-action" to="/discover">Discover people</Link></div> : null}
          {!loading && !error && items.length > 0 ? (
            <div className="notification-list" aria-live="polite">
              {groups.map((group) => (
                <section className="notification-group" key={group.label} aria-labelledby={`notification-group-${group.label.toLowerCase()}`}>
                  <h2 id={`notification-group-${group.label.toLowerCase()}`}>{group.label}</h2>
                  {group.items.map((item) => {
                    const unread = item.read_at === null;
                    const pending = openingId === item.id;
                    const destination = resolveNotificationDestination(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`notification-item${unread ? " notification-item--unread" : ""}`}
                        onClick={() => void openNotification(item)}
                        disabled={pending}
                        aria-label={`${unread ? "Unread notification: " : ""}${item.title}. ${item.body}${destination ? " Open." : unread ? " Mark as read." : ""}`}
                      >
                        <span className="notification-item__icon" aria-hidden="true"><BellIcon /></span>
                        <span className="notification-item__body"><strong>{item.title}</strong><span>{item.body}</span></span>
                        <span className="notification-item__meta">
                          <time dateTime={item.created_at}>{readableTime(item.created_at)}</time>
                          {unread ? <span className="notification-item__mark"><span className="sr-only">Unread</span></span> : null}
                        </span>
                      </button>
                    );
                  })}
                </section>
              ))}
              <div className="notification-list__end">
                <span aria-hidden="true"><BellIcon /></span>
                <div><strong>You’re up to date</strong><p>New DateZA updates will appear here.</p></div>
              </div>
            </div>
          ) : null}
        </section>
          <aside className="notifications-rail" aria-label="Notification information">
          <section className="notifications-rail__card">
            <span className="notifications-rail__icon" aria-hidden="true"><GearIcon /></span>
            <div><h2>Notification settings</h2><p>Choose how DateZA can email or push updates. In-app notifications stay on.</p></div>
            <div className="notifications-channels">
              <Link to="/settings#notifications"><GearIcon />Email and push settings</Link>
              <div><span><BellIcon />In-app notifications</span><span className="notifications-switch notifications-switch--on" aria-label="In-app notifications enabled" /></div>
            </div>
          </section>
          <section className="notifications-rail__card notifications-rail__card--accent">
            <BellIcon aria-hidden="true" />
            <div><h2>Stay connected</h2><p>Important in-app updates appear here and on your notification bell.</p></div>
          </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
