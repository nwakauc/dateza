import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfileDetail } from "../../lib/api/find.ts";
import {
  getNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  parseDatingEventPayload,
  updateNotificationPreferences,
} from "../../lib/api/notifications.ts";
import type { NotificationPreferences, ProductNotification } from "../../lib/api/notificationTypes.ts";
import {
  BellIcon,
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  GearIcon,
  HeartCircleIcon,
  HeartIcon,
  MailIcon,
  PaperPlaneIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SlidersIcon,
  UserIcon,
  UsersIcon,
} from "../shell/icons.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { resolveNotificationDestination } from "./notificationDestination.ts";
import {
  actorFromProfile,
  actorProfileIds,
  compactRelativeTime,
  countPhrase,
  matchesNotificationFilter,
  notificationCopy,
  notificationKind,
  NOTIFICATION_FILTERS,
  unreadCountForFilter,
  type NotificationActor,
  type NotificationFilter,
  type NotificationKind,
} from "./notificationPresentation.ts";

const EMPTY_FILTER: Record<Exclude<NotificationFilter, "all">, { title: string; body: string }> = {
  likes: { title: "No likes yet", body: "When someone likes you, it will show up here." },
  matches: { title: "No matches yet", body: "When you both like each other, it will show up here." },
  messages: { title: "No messages yet", body: "New messages and openers will show up here." },
  activity: { title: "No activity yet", body: "DateZA updates that are not likes, matches, or messages will show up here." },
};

async function loadActors(items: ProductNotification[]): Promise<Record<string, NotificationActor>> {
  const ids = actorProfileIds(items);
  const resolved = await Promise.all(
    ids.map(async (id) => {
      try {
        const { profile } = await getProfileDetail(id);
        return [id, actorFromProfile(profile)] as const;
      } catch {
        return [id, undefined] as const;
      }
    }),
  );
  const actors: Record<string, NotificationActor> = {};
  for (const [id, actor] of resolved) {
    if (actor) actors[id] = actor;
  }
  return actors;
}

function actorFor(item: ProductNotification, actors: Record<string, NotificationActor>): NotificationActor | undefined {
  const payload = parseDatingEventPayload(item.payload);
  return payload ? actors[payload.actor.profile_id] : undefined;
}

function TypeBadge({ kind }: { kind: NotificationKind }) {
  const icon =
    kind === "like" ? <HeartIcon /> :
    kind === "match" ? <HeartCircleIcon /> :
    kind === "message" || kind === "opener" ? <ChatIcon /> :
    kind === "welcome" ? <ShieldIcon /> :
    <BellIcon />;
  return (
    <span className={`notification-item__badge notification-item__badge--${kind}`} aria-hidden="true">
      {icon}
    </span>
  );
}

function NotificationAvatar({
  kind,
  actor,
  ownAvatarUrl,
  ownInitial,
}: {
  kind: NotificationKind;
  actor: NotificationActor | undefined;
  ownAvatarUrl: string | null;
  ownInitial: string;
}) {
  const photo = actor?.photoUrl;
  const initial = actor?.displayName?.trim()?.[0]?.toUpperCase() ?? "D";
  if (kind === "match" && (photo || ownAvatarUrl)) {
    return (
      <span className="notification-item__avatars" aria-hidden="true">
        {photo ? <img src={photo} alt="" /> : <span>{initial}</span>}
        {ownAvatarUrl ? <img src={ownAvatarUrl} alt="" /> : <span>{ownInitial}</span>}
        <TypeBadge kind={kind} />
      </span>
    );
  }
  return (
    <span className="notification-item__avatar" aria-hidden="true">
      {photo ? <img src={photo} alt="" /> : <span>{initial}</span>}
      <TypeBadge kind={kind} />
    </span>
  );
}

function ChannelSwitch({
  label,
  ariaLabel,
  checked,
  disabled,
  onChange,
  icon,
}: {
  label: string;
  ariaLabel?: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (next: boolean) => void;
  icon: ReactNode;
}) {
  return (
    <div className="notifications-channel">
      <span>
        {icon}
        {label}
      </span>
      <button
        type="button"
        className={`notifications-switch${checked ? " notifications-switch--on" : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        disabled={disabled || !onChange}
        onClick={onChange ? () => onChange(!checked) : undefined}
      />
    </div>
  );
}

export default function NotificationsPage() {
  const account = useOwnAccount();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProductNotification[]>([]);
  const [actors, setActors] = useState<Record<string, NotificationActor>>({});
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsError, setPrefsError] = useState<string>();
  const [prefsSaving, setPrefsSaving] = useState<"product_email_enabled" | "push_enabled" | null>(null);
  const [prefsSaveError, setPrefsSaveError] = useState<string>();
  const [prefsAttempt, setPrefsAttempt] = useState(0);

  const load = useCallback(() => {
    void listNotifications()
      .then(async (result) => {
        const nextActors = await loadActors(result.notifications);
        setItems(result.notifications);
        setActors(nextActors);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  function retry() {
    setError(false);
    setLoading(true);
    load();
  }

  useEffect(() => {
    document.title = "Notifications — DateZA";
    load();
    return () => { document.title = "DateZA — Meet someone who chooses you."; };
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void getNotificationPreferences()
      .then((result) => {
        if (!cancelled) {
          setPrefs(result);
          setPrefsError(undefined);
        }
      })
      .catch(() => {
        if (!cancelled) setPrefsError("We couldn’t load your notification settings. Try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [prefsAttempt]);

  async function togglePreference(key: "product_email_enabled" | "push_enabled", next: boolean) {
    if (!prefs || prefsSaving) return;
    const previous = prefs;
    setPrefs({ ...prefs, [key]: next });
    setPrefsSaving(key);
    setPrefsSaveError(undefined);
    try {
      const updated = await updateNotificationPreferences({ [key]: next });
      setPrefs(updated);
    } catch {
      setPrefs(previous);
      setPrefsSaveError("We couldn’t save that setting. Try again.");
    } finally {
      setPrefsSaving(null);
    }
  }

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
  const visible = items.filter((item) => matchesNotificationFilter(item, filter));
  const emptyCopy = filter === "all" ? null : EMPTY_FILTER[filter];
  const unreadLikes = unreadCountForFilter(items, "likes");
  const unreadMatches = unreadCountForFilter(items, "matches");
  const unreadMessages = unreadCountForFilter(items, "messages");

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
        <div className="notifications-mobile-bar">
          <Link to="/discover" className="notifications-mobile-bar__back" aria-label="Back">
            <ChevronLeftIcon />
          </Link>
          <p>Notifications</p>
          <Link to="/settings#notifications" className="notifications-mobile-bar__settings" aria-label="Notification settings">
            <GearIcon />
          </Link>
        </div>
        <div className="shell-page__header shell-page__header--with-action">
          <div>
            <h1 className="shell-page__title">Notifications</h1>
            <p className="shell-page__subtitle">Stay in the loop with what’s happening on DateZA.</p>
          </div>
          {hasUnread ? (
            <button className="shell-text-action" type="button" onClick={() => void readAll()} disabled={markingAll}>
              {markingAll ? "Marking read…" : "Mark all read"}
            </button>
          ) : null}
        </div>
        {openError ? <p className="shell-inline-error" role="alert">{openError}</p> : null}
        <div className="onboard-segmented notifications-tabs" role="tablist" aria-label="Filter notifications">
          {NOTIFICATION_FILTERS.map((tab) => {
            const selected = filter === tab.id;
            const count = unreadCountForFilter(items, tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={count > 0 ? `${tab.label}, ${count}` : tab.label}
                className="onboard-segment notifications-tabs__button"
                data-selected={selected ? "true" : "false"}
                onClick={() => setFilter(tab.id)}
              >
                {tab.label}
                {count > 0 ? <span className="notifications-tabs__count">{count}</span> : null}
              </button>
            );
          })}
        </div>
        <div className="notifications-layout">
          <section className="notifications-feed" aria-label="Notification activity">
            {loading ? (
              <div className="notification-skeletons" aria-live="polite" aria-label="Loading notifications">
                {[0, 1, 2, 3].map((item) => <div className="notification-skeleton" key={item}><span /><div><i /><i /></div></div>)}
              </div>
            ) : null}
            {error ? (
              <div className="shell-empty">
                <BellIcon className="shell-empty__icon" />
                <p className="shell-empty__title">We couldn’t load your notifications</p>
                <p className="shell-empty__body">Check your connection, then try again.</p>
                <button className="shell-primary-action" type="button" onClick={retry}>Try again</button>
              </div>
            ) : null}
            {!loading && !error && items.length === 0 ? (
              <div className="shell-empty">
                <BellIcon className="shell-empty__icon" />
                <p className="shell-empty__title">You’re all caught up</p>
                <p className="shell-empty__body">New DateZA updates will appear here.</p>
                <Link className="shell-primary-action" to="/discover">Discover people</Link>
              </div>
            ) : null}
            {!loading && !error && items.length > 0 && visible.length === 0 && emptyCopy ? (
              <div className="shell-empty">
                <BellIcon className="shell-empty__icon" />
                <p className="shell-empty__title">{emptyCopy.title}</p>
                <p className="shell-empty__body">{emptyCopy.body}</p>
              </div>
            ) : null}
            {!loading && !error && visible.length > 0 ? (
              <div className="notification-list" aria-live="polite">
                {visible.map((item) => {
                  const unread = item.read_at === null;
                  const pending = openingId === item.id;
                  const destination = resolveNotificationDestination(item);
                  const kind = notificationKind(item.type);
                  const actor = actorFor(item, actors);
                  const copy = notificationCopy(item, actor);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`notification-item${unread ? " notification-item--unread" : ""}`}
                      onClick={() => void openNotification(item)}
                      disabled={pending}
                      aria-label={`${unread ? "Unread notification: " : ""}${copy.title}. ${copy.subtitle}${destination ? " Open." : unread ? " Mark as read." : ""}`}
                    >
                      <NotificationAvatar
                        kind={kind}
                        actor={actor}
                        ownAvatarUrl={account.avatarUrl}
                        ownInitial={account.initial}
                      />
                      <span className="notification-item__body">
                        <strong>{copy.title}</strong>
                        <span>{copy.subtitle}</span>
                      </span>
                      <span className="notification-item__meta">
                        <time dateTime={item.created_at}>{compactRelativeTime(item.created_at)}</time>
                        {unread ? <span className="notification-item__mark"><span className="sr-only">Unread</span></span> : null}
                        <ChevronRightIcon className="notification-item__chevron" />
                      </span>
                    </button>
                  );
                })}
                <div className="notification-list__end">
                  <span aria-hidden="true"><BellIcon /></span>
                  <div>
                    <strong>You’re up to date</strong>
                    <p>New DateZA updates will appear here.</p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
          <aside className="notifications-rail" aria-label="Notification information">
            <section className="notifications-rail__card notifications-rail__card--settings">
              <div className="notifications-rail__heading">
                <h2>Notification settings</h2>
                <p>Choose how DateZA can reach you. In-app updates stay on.</p>
              </div>
              {prefsError ? (
                <div className="notifications-rail__error" role="alert">
                  <p>{prefsError}</p>
                  <button type="button" onClick={() => setPrefsAttempt((current) => current + 1)}>Try again</button>
                </div>
              ) : prefs ? (
                <div className="notifications-channels">
                  <ChannelSwitch
                    label="Push notifications"
                    icon={<BellIcon />}
                    checked={prefs.push_enabled}
                    disabled={prefsSaving !== null}
                    onChange={(next) => void togglePreference("push_enabled", next)}
                  />
                  <ChannelSwitch
                    label="Email notifications"
                    icon={<MailIcon />}
                    checked={prefs.product_email_enabled}
                    disabled={prefsSaving !== null}
                    onChange={(next) => void togglePreference("product_email_enabled", next)}
                  />
                  <ChannelSwitch
                    label="In-app notifications"
                    ariaLabel="In-app notifications, always on"
                    icon={<BellIcon />}
                    checked
                    disabled
                  />
                </div>
              ) : (
                <p className="notifications-rail__loading">Loading notification settings…</p>
              )}
              {prefsSaveError ? <p className="notifications-rail__error" role="alert">{prefsSaveError}</p> : null}
              <div className="notifications-rail__banner">
                <BellIcon aria-hidden="true" />
                <p>Stay connected. Get notified about new likes, matches, messages and more.</p>
              </div>
            </section>
            <section className="notifications-rail__card notifications-rail__card--activity">
              <h2>Recent activity</h2>
              <ul>
                <li><HeartIcon />{countPhrase(unreadLikes, "new like", "new likes")}</li>
                <li><HeartCircleIcon />{countPhrase(unreadMatches, "new match", "new matches")}</li>
                <li><ChatIcon />{countPhrase(unreadMessages, "new message", "new messages")}</li>
              </ul>
            </section>
            {prefs && !prefs.push_enabled ? (
              <section className="notifications-rail__card notifications-rail__card--cta">
                <span className="notifications-rail__cta-icon" aria-hidden="true"><PaperPlaneIcon /></span>
                <div>
                  <h2>Enable notifications</h2>
                  <p>Allow DateZA to send push alerts when a device is registered.</p>
                  <button
                    className="shell-primary-action"
                    type="button"
                    disabled={prefsSaving !== null}
                    onClick={() => void togglePreference("push_enabled", true)}
                  >
                    Enable notifications
                  </button>
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
