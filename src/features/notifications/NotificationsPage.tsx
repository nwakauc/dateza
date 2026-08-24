import { useCallback, useEffect, useState } from "react";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../../lib/api/notifications.ts";
import type { ProductNotification } from "../../lib/api/notificationTypes.ts";
import { BellIcon } from "../shell/icons.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";

function readableDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export default function NotificationsPage() {
  const account = useOwnAccount();
  const [items, setItems] = useState<ProductNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    void listNotifications().then((result) => setItems(result.notifications)).catch(() => setError(true)).finally(() => setLoading(false));
  }, []);

  function retry() { setError(false); setLoading(true); load(); }

  useEffect(() => {
    document.title = "Notifications — DateZA";
    load();
    return () => { document.title = "DateZA — Meet someone who chooses you."; };
  }, [load]);

  async function readOne(item: ProductNotification) {
    if (item.read_at) return;
    try { const updated = await markNotificationRead(item.id); setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry)); account.refresh(); } catch { /* Keep it unread so the member can retry. */ }
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
  return (
    <div className="shell-page shell-page--narrow">
      <div className="shell-page__header shell-page__header--with-action">
        <div><p className="shell-page__eyebrow">Updates</p><h1 className="shell-page__title">Notifications</h1><p className="shell-page__subtitle">The important things happening on DateZA.</p></div>
        {hasUnread ? <button className="shell-text-action" type="button" onClick={() => void readAll()} disabled={markingAll}>{markingAll ? "Marking read…" : "Mark all read"}</button> : null}
      </div>
      {loading ? <div className="shell-loading" aria-live="polite"><span />Loading notifications…</div> : null}
      {error ? <div className="shell-empty"><BellIcon className="shell-empty__icon" /><p className="shell-empty__title">Notifications didn’t load</p><p className="shell-empty__body">Check your connection, then try again.</p><button className="shell-primary-action" type="button" onClick={retry}>Try again</button></div> : null}
      {!loading && !error && items.length === 0 ? <div className="shell-empty"><BellIcon className="shell-empty__icon" /><p className="shell-empty__title">You’re all caught up</p><p className="shell-empty__body">New DateZA updates will appear here.</p></div> : null}
      {!loading && !error && items.length > 0 ? <div className="notification-list">{items.map((item) => <button key={item.id} type="button" className={`notification-item${item.read_at ? "" : " notification-item--unread"}`} onClick={() => void readOne(item)}><span className="notification-item__mark" /><span className="notification-item__body"><strong>{item.title}</strong><span>{item.body}</span><time dateTime={item.created_at}>{readableDate(item.created_at)}</time></span></button>)}</div> : null}
    </div>
  );
}
