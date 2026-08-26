import { ApiError } from "./errors.ts";
import { apiRequest } from "./client.ts";
import { parseCompatibility, parsePublicProfile } from "./find.ts";
import { parseOpenerState } from "./openerTypes.ts";
import type { DiscoveryProfile, DiscoveryResponse, DiscoverySelection } from "./discoveryTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseDiscoveryProfile(value: unknown): DiscoveryProfile {
  const base = parsePublicProfile(value);
  const record = value as Record<string, unknown>;
  return {
    ...base,
    verified: asBoolean(record.verified, false),
    online: asBoolean(record.online, false),
    active_today: asBoolean(record.active_today, false),
    new_here: asBoolean(record.new_here, false),
    last_active_at: asStringOrNull(record.last_active_at),
    distance_km: asNumberOrNull(record.distance_km),
    compatibility: parseCompatibility(record.compatibility),
    opener_state: parseOpenerState(record.opener_state),
  };
}

function parseSelection(value: unknown): DiscoverySelection {
  if (
    !isRecord(value) ||
    typeof value.allocation_date !== "string" ||
    typeof value.daily_limit !== "number" ||
    typeof value.count !== "number" ||
    typeof value.finalized !== "boolean" ||
    typeof value.refreshes_at !== "string"
  ) {
    throw new ApiError(502, undefined, "invalid_discovery_response");
  }
  return {
    allocation_date: value.allocation_date,
    daily_limit: value.daily_limit,
    count: value.count,
    finalized: value.finalized,
    refreshes_at: value.refreshes_at,
  };
}

/**
 * GET /api/v1/discovery — DateZA's curated daily selection. Not Find: no
 * cursor is sent, and the allocation is finalized (and persisted in order)
 * on first request, so this always fetches the member's full current batch.
 */
export function getDiscoveryProfiles(): Promise<DiscoveryResponse> {
  return apiRequest("/api/v1/discovery").then((data) => {
    if (!isRecord(data) || !Array.isArray(data.profiles)) {
      throw new ApiError(502, undefined, "invalid_discovery_response");
    }
    return {
      profiles: data.profiles.map(parseDiscoveryProfile),
      selection: parseSelection(data.selection),
    };
  });
}
