import { useEffect, useState } from "react";
import {
  clearBrandAdminAccessCache,
  probeBrandAdminAccess,
  type BrandAdminAccess,
} from "../../lib/hq/adminAccess.ts";
import { useSession } from "../session/useSession.ts";

/** Resolves brand-admin access for the signed-in user (button + /hq gate). */
export function useBrandAdminAccess(): BrandAdminAccess {
  const { session } = useSession();
  const userId = session.status === "authenticated" ? session.user.user_id : null;
  const [probe, setProbe] = useState<{
    userId: number;
    access: Exclude<BrandAdminAccess, "unknown">;
  } | null>(null);

  useEffect(() => {
    if (userId === null) {
      clearBrandAdminAccessCache();
      return;
    }

    let cancelled = false;
    void probeBrandAdminAccess(userId).then((access) => {
      if (!cancelled) {
        setProbe({ userId, access });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (userId === null) {
    return "forbidden";
  }
  if (probe?.userId !== userId) {
    return "unknown";
  }
  return probe.access;
}
