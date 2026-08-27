import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ToastApiContext, ToastItemsContext } from "./toastContextValue.ts";
import { MAX_VISIBLE_TOASTS, TOAST_DURATION, type ShowToastInput, type ToastApi, type ToastItem } from "./toastTypes.ts";

let toastSeq = 0;

function nextToastId(): string {
  toastSeq += 1;
  return `toast-${toastSeq}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((input: ShowToastInput) => {
    const id = nextToastId();
    const item: ToastItem = {
      id,
      tone: input.tone,
      title: input.title,
      subtitle: input.subtitle,
      href: input.href,
      photoUrl: input.photoUrl ?? undefined,
      notificationId: input.notificationId,
      durationMs: input.durationMs ?? TOAST_DURATION[input.tone],
    };
    setItems((current) => [...current, item].slice(-MAX_VISIBLE_TOASTS));
    return id;
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (title, subtitle) => show({ tone: "success", title, subtitle }),
      error: (title, subtitle) => show({ tone: "error", title, subtitle }),
    }),
    [dismiss, show],
  );

  return (
    <ToastApiContext.Provider value={api}>
      <ToastItemsContext.Provider value={items}>{children}</ToastItemsContext.Provider>
    </ToastApiContext.Provider>
  );
}
