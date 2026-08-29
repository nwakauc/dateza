import { createContext } from "react";

export type HqOperatorContextValue = {
  status: "loading" | "ready" | "unauthenticated" | "unavailable";
  brandSlug: string | null;
  brandName: string | null;
  operatorLabel: string;
  errorMessage: string | null;
};

export const HqOperatorContext = createContext<HqOperatorContextValue | null>(null);
