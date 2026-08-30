import { apiRequest } from "../api/client.ts";
import { ApiError } from "../api/errors.ts";
import {
  parseAdminEnforcementResponse,
  parseAdminReport,
  parseAdminReportList,
  parseAuthAttemptList,
  parseDiscoveryDiagnostic,
  parseEnforcementList,
  parseMember360,
  parseRepeatOffenderList,
  parseSecurityEventList,
  parseTrustSafetyOverview,
} from "./parse.ts";
import type {
  HqAdminEnforcement,
  HqAdminReport,
  HqAdminReportList,
  HqAdminReportListParams,
  HqAuthAttemptList,
  HqDiscoveryDiagnostic,
  HqEnforcementList,
  HqHistoryParams,
  HqMember360,
  HqRepeatOffenderList,
  HqSecurityEventList,
  HqSuspendProfileBody,
  HqTrustSafetyEnforcementParams,
  HqTrustSafetyOverview,
  HqUpdateReportBody,
} from "./types.ts";

/**
 * HQ + reused admin moderation client.
 * Brand is host-derived by D8N; never send a client brand parameter.
 */

function memberPath(lookup: string, suffix = ""): string {
  const trimmed = lookup.trim();
  if (!trimmed) {
    throw new ApiError(400, "invalid_lookup", "invalid_lookup");
  }
  return `/api/v1/hq/members/${encodeURIComponent(trimmed)}${suffix}`;
}

function historyQuery(params: HqHistoryParams | undefined): string {
  const query = new URLSearchParams();
  if (params?.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params?.limit !== undefined) {
    query.set("limit", String(params.limit));
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

export async function fetchHqMember360(lookup: string): Promise<HqMember360> {
  const data = await apiRequest(memberPath(lookup));
  return parseMember360(data);
}

/** Lookup = Member 360 GET. 404 `member_unavailable` means not found on this brand. */
export async function lookupHqMember(
  lookup: string,
): Promise<{ found: true; member: HqMember360 } | { found: false }> {
  try {
    const member = await fetchHqMember360(lookup);
    return { found: true, member };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { found: false };
    }
    throw error;
  }
}

export async function fetchHqSecurityEvents(
  lookup: string,
  params?: HqHistoryParams,
): Promise<HqSecurityEventList> {
  const data = await apiRequest(memberPath(lookup, `/security_events${historyQuery(params)}`));
  return parseSecurityEventList(data);
}

export async function fetchHqAuthAttempts(
  lookup: string,
  params?: HqHistoryParams,
): Promise<HqAuthAttemptList> {
  const data = await apiRequest(memberPath(lookup, `/auth_attempts${historyQuery(params)}`));
  return parseAuthAttemptList(data);
}

export async function fetchHqEnforcements(
  lookup: string,
  params?: HqHistoryParams,
): Promise<HqEnforcementList> {
  const data = await apiRequest(memberPath(lookup, `/enforcements${historyQuery(params)}`));
  return parseEnforcementList(data);
}

export async function fetchHqDiscoveryDiagnostic(lookup: string): Promise<HqDiscoveryDiagnostic> {
  const data = await apiRequest(memberPath(lookup, "/discovery_diagnostic"));
  return parseDiscoveryDiagnostic(data);
}

function appendQuery(base: string, params: URLSearchParams): string {
  const encoded = params.toString();
  return encoded ? `${base}?${encoded}` : base;
}

export async function fetchTrustSafetyOverview(): Promise<HqTrustSafetyOverview> {
  const data = await apiRequest("/api/v1/hq/trust_safety/overview");
  return parseTrustSafetyOverview(data);
}

export async function fetchRepeatOffenders(limit?: number): Promise<HqRepeatOffenderList> {
  const query = new URLSearchParams();
  if (limit !== undefined) {
    query.set("limit", String(limit));
  }
  const data = await apiRequest(appendQuery("/api/v1/hq/trust_safety/repeat_offenders", query));
  return parseRepeatOffenderList(data);
}

export async function fetchTrustSafetyEnforcements(
  params?: HqTrustSafetyEnforcementParams,
): Promise<HqEnforcementList> {
  const query = new URLSearchParams();
  if (params?.state) {
    query.set("state", params.state);
  }
  if (params?.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params?.limit !== undefined) {
    query.set("limit", String(params.limit));
  }
  const data = await apiRequest(appendQuery("/api/v1/hq/trust_safety/enforcements", query));
  return parseEnforcementList(data);
}

export async function fetchAdminReports(
  params?: HqAdminReportListParams,
): Promise<HqAdminReportList> {
  const query = new URLSearchParams();
  if (params?.status) {
    query.set("status", params.status);
  }
  if (params?.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params?.limit !== undefined) {
    query.set("limit", String(params.limit));
  }
  const data = await apiRequest(appendQuery("/api/v1/admin/reports", query));
  return parseAdminReportList(data);
}

export async function fetchAdminReport(id: number): Promise<HqAdminReport> {
  const data = await apiRequest(`/api/v1/admin/reports/${id}`);
  return parseAdminReport(data);
}

export async function updateAdminReport(
  id: number,
  body: HqUpdateReportBody,
): Promise<HqAdminReport> {
  const data = await apiRequest(`/api/v1/admin/reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseAdminReport(data);
}

export async function suspendAdminProfile(
  profileId: string,
  body?: HqSuspendProfileBody,
): Promise<HqAdminEnforcement> {
  const trimmed = profileId.trim();
  if (!trimmed) {
    throw new ApiError(400, "invalid_lookup", "invalid_lookup");
  }
  const data = await apiRequest(`/api/v1/admin/profiles/${encodeURIComponent(trimmed)}/suspension`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return parseAdminEnforcementResponse(data);
}

export async function reinstateAdminProfile(profileId: string): Promise<HqAdminEnforcement> {
  const trimmed = profileId.trim();
  if (!trimmed) {
    throw new ApiError(400, "invalid_lookup", "invalid_lookup");
  }
  const data = await apiRequest(`/api/v1/admin/profiles/${encodeURIComponent(trimmed)}/suspension`, {
    method: "DELETE",
  });
  return parseAdminEnforcementResponse(data);
}

export function hqErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Something went wrong talking to D8N. Try again.";
  }
  if (error.status === 401) {
    return "Your session expired. Sign in again to continue.";
  }
  if (error.status === 403) {
    return "You are signed in, but you are not an admin for this brand.";
  }
  if (error.status === 404) {
    if (error.code === "report_unavailable") {
      return "That report is unavailable for this brand.";
    }
    if (error.code === "profile_unavailable") {
      return "This member has no profile on this brand yet.";
    }
    return "No matching member was found for this brand.";
  }
  if (error.status === 409) {
    if (error.code === "already_suspended") {
      return "That profile is already suspended on this brand.";
    }
    if (error.code === "not_suspended") {
      return "That profile is not currently suspended.";
    }
    if (error.code === "report_conflict") {
      return "Another moderator already resolved this report. Refresh and review the current status.";
    }
    return "This action conflicts with the current state. Refresh and try again.";
  }
  if (error.status === 422) {
    if (error.code === "invalid_cursor") {
      return "That page cursor is no longer valid. Start again from the first page.";
    }
    if (error.code === "invalid_limit") {
      return "That page size is not allowed.";
    }
    if (error.code === "invalid_filter") {
      return "That filter is not valid for this request.";
    }
    if (error.code === "invalid_transition") {
      return "That status change is not allowed from the report's current state.";
    }
    return "The request was rejected. Check the lookup or paging parameters.";
  }
  if (error.status >= 500 || error.message.startsWith("invalid_hq_")) {
    return "The HQ API returned an unexpected response.";
  }
  return "The HQ request failed. Try again.";
}
