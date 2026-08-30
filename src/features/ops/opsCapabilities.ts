import { operatorHasAnyCapability, operatorHasCapability } from "../../lib/hq/capabilities.ts";
import type { HqCapability, HqCurrentOperator } from "../../lib/hq/types.ts";
import type { OpsNavItem } from "./navConfig.ts";

export function canAccessOpsNavItem(
  operator: HqCurrentOperator | null | undefined,
  item: OpsNavItem,
): boolean {
  if (!operator) return false;
  if (!item.capabilities) return true;
  return operatorHasAnyCapability(operator, item.capabilities);
}

export function opsCan(
  operator: HqCurrentOperator | null | undefined,
  capability: HqCapability,
): boolean {
  return operatorHasCapability(operator, capability);
}
