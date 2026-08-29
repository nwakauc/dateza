import { useContext } from "react";
import { HqOperatorContext } from "./hqBrandContextValue.ts";

export function useHqBrand() {
  const value = useContext(HqOperatorContext);
  if (!value) {
    throw new Error("useHqBrand must be used within HqBrandProvider");
  }
  return value;
}
