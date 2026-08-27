import { useContext } from "react";
import { NOOP_TOAST_API, ToastApiContext, ToastItemsContext } from "./toastContextValue.ts";
import type { ToastApi, ToastItem } from "./toastTypes.ts";

export function useToast(): ToastApi {
  return useContext(ToastApiContext) ?? NOOP_TOAST_API;
}

export function useToastItems(): ToastItem[] {
  return useContext(ToastItemsContext);
}
