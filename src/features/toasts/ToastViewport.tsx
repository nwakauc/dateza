import { useEffect } from "react";
import { Link } from "react-router-dom";
import { markNotificationRead } from "../../lib/api/notifications.ts";
import {
  ChatIcon,
  CheckCircleIcon,
  CloseIcon,
  HeartIcon,
  PaperPlaneIcon,
} from "../shell/icons.tsx";
import { useToast, useToastItems } from "./useToast.ts";
import type { ToastItem, ToastTone } from "./toastTypes.ts";

function ToastMark({ tone, photoUrl }: { tone: ToastTone; photoUrl?: string }) {
  if (photoUrl) {
    return <img className="toast__photo" src={photoUrl} alt="" width="40" height="40" />;
  }
  if (tone === "success") return <CheckCircleIcon className="toast__glyph" />;
  if (tone === "error") return <span className="toast__bang" aria-hidden="true">!</span>;
  if (tone === "message") return <ChatIcon className="toast__glyph" />;
  if (tone === "opener") return <PaperPlaneIcon className="toast__glyph" />;
  return <HeartIcon className="toast__glyph" />;
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (item.durationMs <= 0) return;
    const timer = window.setTimeout(() => onDismiss(item.id), item.durationMs);
    return () => window.clearTimeout(timer);
  }, [item.durationMs, item.id, onDismiss]);

  function activate() {
    if (item.notificationId) void markNotificationRead(item.notificationId).catch(() => undefined);
    onDismiss(item.id);
  }

  const live = item.tone === "error" ? "assertive" : "polite";
  const body = (
    <>
      <span className="toast__mark" aria-hidden="true">
        <ToastMark tone={item.tone} photoUrl={item.photoUrl} />
      </span>
      <span className="toast__copy">
        <strong>{item.title}</strong>
        {item.subtitle ? <span>{item.subtitle}</span> : null}
      </span>
    </>
  );

  return (
    <div className={`toast toast--${item.tone}`} role={item.tone === "error" ? "alert" : "status"} aria-live={live}>
      {item.href ? (
        <Link className="toast__body" to={item.href} onClick={activate}>
          {body}
        </Link>
      ) : (
        <div className="toast__body">{body}</div>
      )}
      <button type="button" className="toast__close" aria-label="Dismiss" onClick={() => onDismiss(item.id)}>
        <CloseIcon />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const items = useToastItems();
  const { dismiss } = useToast();
  if (items.length === 0) return null;
  return (
    <div className="toast-viewport" aria-label="Notifications">
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={dismiss} />
      ))}
    </div>
  );
}
