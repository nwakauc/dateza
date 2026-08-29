import { apiRequest } from "../api/client.ts";
import { ApiError } from "../api/errors.ts";

export type BrandAdminAccess = "unknown" | "allowed" | "forbidden" | "unavailable";

let cached: { userId: number; access: Exclude<BrandAdminAccess, "unknown"> } | null = null;

/**
 * Whether the current session is an authorized moderator for this brand.
 * OpenAPI does not expose admin status on GET /me, so we use the same
 * ModeratorContext gate as HQ: a minimal admin list call.
 * 200 → admin; 403 → not an admin for this brand.
 */
export async function probeBrandAdminAccess(userId: number): Promise<Exclude<BrandAdminAccess, "unknown">> {
  if (cached?.userId === userId) {
    return cached.access;
  }

  try {
    await apiRequest("/api/v1/admin/reports?limit=1");
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

export function clearBrandAdminAccessCache(): void {
  cached = null;
}
