import { fetchHqOperator } from "./api.ts";
import { ApiError } from "../api/errors.ts";

export type HqOperatorAccess = "unknown" | "allowed" | "forbidden" | "unavailable";

let cached: { userId: number; access: Exclude<HqOperatorAccess, "unknown"> } | null = null;

/**
 * Whether the current session has an active operator assignment on this brand.
 * Uses GET /api/v1/hq/operator — MFA step-up is not required for this probe.
 */
export async function probeHqOperatorAccess(
  userId: number,
): Promise<Exclude<HqOperatorAccess, "unknown">> {
  if (cached?.userId === userId) {
    return cached.access;
  }

  try {
    await fetchHqOperator();
    cached = { userId, access: "allowed" };
    return "allowed";
  } catch (error: unknown) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 401)) {
      cached = { userId, access: "forbidden" };
      return "forbidden";
    }
    return "unavailable";
  }
}

export function clearHqOperatorAccessCache(): void {
  cached = null;
}

/** @deprecated Use probeHqOperatorAccess */
export const probeBrandAdminAccess = probeHqOperatorAccess;

/** @deprecated Use clearHqOperatorAccessCache */
export const clearBrandAdminAccessCache = clearHqOperatorAccessCache;

export type BrandAdminAccess = HqOperatorAccess;
