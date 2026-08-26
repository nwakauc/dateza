import { apiRequest } from "./client.ts";
import { ApiError } from "./errors.ts";
import type { BlockedProfile, BlockResponse, ProfileReportReason, ReportResponse } from "./safetyTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function listBlockedProfiles(): Promise<BlockedProfile[]> {
  return apiRequest("/api/v1/blocks").then((data) => {
    if (!isRecord(data) || !Array.isArray(data.blocks)) {
      throw new ApiError(502, undefined, "invalid_blocks_response");
    }
    return data.blocks.flatMap((item) => {
      if (
        !isRecord(item) ||
        !isRecord(item.profile) ||
        typeof item.profile.id !== "string" ||
        typeof item.profile.display_name !== "string" ||
        typeof item.blocked_at !== "string"
      ) {
        return [];
      }
      return [{
        profile: { id: item.profile.id, display_name: item.profile.display_name },
        blocked_at: item.blocked_at,
      }];
    });
  });
}

/** POST /api/v1/profiles/:profile_id/block */
export function blockProfile(profileId: string): Promise<BlockResponse> {
  return apiRequest(`/api/v1/profiles/${encodeURIComponent(profileId)}/block`, { method: "POST" }).then((data) => {
    if (!isRecord(data) || data.blocked !== true) {
      throw new ApiError(502, undefined, "invalid_block_response");
    }
    return { blocked: true, created: asBoolean(data.created, true) };
  });
}

/** DELETE /api/v1/profiles/:profile_id/block */
export function unblockProfile(profileId: string): Promise<void> {
  return apiRequest(`/api/v1/profiles/${encodeURIComponent(profileId)}/block`, { method: "DELETE" }).then(
    () => undefined,
  );
}

/** POST /api/v1/profiles/:profile_id/report */
export function reportProfile(
  profileId: string,
  body: { reason: ProfileReportReason; note?: string },
): Promise<ReportResponse> {
  const payload: { reason: ProfileReportReason; note?: string } = { reason: body.reason };
  const note = body.note?.trim();
  if (note) payload.note = note;
  return apiRequest(`/api/v1/profiles/${encodeURIComponent(profileId)}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((data) => {
    if (!isRecord(data) || data.reported !== true) {
      throw new ApiError(502, undefined, "invalid_report_response");
    }
    return { reported: true, created: asBoolean(data.created, true) };
  });
}
