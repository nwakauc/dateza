import { useCallback, useState } from "react";
import { ApiError } from "../../../lib/api/errors.ts";
import {
  fetchHqMemberDirectory,
  fetchProfilePhotoQueue,
  fetchRepeatOffenders,
  fetchTrustSafetyEnforcements,
  fetchTrustSafetyOverview,
  hqErrorMessage,
} from "../../../lib/hq/api.ts";
import type { HqAdminEnforcement, HqMemberDirectoryEntry, HqTrustSafetyOverview } from "../../../lib/hq/types.ts";
import { opsCan } from "../opsCapabilities.ts";

export type OpsDashboardData = {
  generatedAt: string;
  overview: HqTrustSafetyOverview | null;
  pendingPhotos: number | null;
  repeatOffenderCount: number | null;
  repeatOffenderTruncated: boolean;
  recentEnforcements: HqAdminEnforcement[];
  recentSignups: HqMemberDirectoryEntry[];
};

export type OpsDashboardState =
  | { status: "loading" }
  | { status: "ready"; data: OpsDashboardData; updatedAt: string }
  | { status: "partial"; data: OpsDashboardData; updatedAt: string; errors: string[] }
  | { status: "error"; message: string };

export function useOpsDashboard(operator: ReturnType<typeof import("../../hq/useHqOperator.ts").useHqOperator>["operator"]) {
  const [state, setState] = useState<OpsDashboardState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const errors: string[] = [];
    const data: OpsDashboardData = {
      generatedAt: new Date().toISOString(),
      overview: null,
      pendingPhotos: null,
      repeatOffenderCount: null,
      repeatOffenderTruncated: false,
      recentEnforcements: [],
      recentSignups: [],
    };

    if (opsCan(operator, "hq.member.sensitive_read")) {
      try {
        const directory = await fetchHqMemberDirectory({ limit: 8 });
        data.recentSignups = directory.members;
      } catch (error) {
        errors.push(hqErrorMessage(error));
      }
    }

    if (opsCan(operator, "hq.trust_safety.read")) {
      try {
        data.overview = await fetchTrustSafetyOverview();
        data.generatedAt = data.overview.generated_at;
      } catch (error) {
        errors.push(hqErrorMessage(error));
      }
    }

    if (opsCan(operator, "admin.profile_photos.moderate")) {
      try {
        const queue = await fetchProfilePhotoQueue();
        data.pendingPhotos = queue.photos.length;
      } catch (error) {
        errors.push(hqErrorMessage(error));
      }
    }

    if (opsCan(operator, "hq.trust_safety.read")) {
      try {
        const offenders = await fetchRepeatOffenders(100);
        data.repeatOffenderCount = offenders.repeat_offenders.length;
        data.repeatOffenderTruncated = offenders.truncated;
      } catch (error) {
        errors.push(hqErrorMessage(error));
      }

      try {
        const enforcements = await fetchTrustSafetyEnforcements({ limit: 5 });
        data.recentEnforcements = enforcements.enforcements;
      } catch (error) {
        errors.push(hqErrorMessage(error));
      }
    }

    const updatedAt = new Date().toISOString();
    if (!data.overview && errors.length > 0 && errors.every((e) => e.includes("authorized"))) {
      setState({ status: "error", message: errors[0] ?? "Could not load dashboard." });
      return;
    }

    if (errors.length > 0) {
      setState({ status: "partial", data, updatedAt, errors });
      return;
    }

    setState({ status: "ready", data, updatedAt });
  }, [operator]);

  return { state, load };
}

export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}
