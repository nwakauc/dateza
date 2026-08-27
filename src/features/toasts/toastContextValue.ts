import { createContext } from "react";
import type { ToastApi, ToastItem } from "./toastTypes.ts";

export const ToastItemsContext = createContext<ToastItem[]>([]);
export const ToastApiContext = createContext<ToastApi | null>(null);

export const NOOP_TOAST_API: ToastApi = {
  show: () => "",
  dismiss: () => undefined,
  success: () => "",
  error: () => "",
};
