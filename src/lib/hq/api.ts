import { apiRequest } from "../api/client.ts";
import { ApiError } from "../api/errors.ts";
import {
  parseAuthAttemptList,
  parseDiscoveryDiagnostic,
  parseEnforcementList,
  parseMember360,
  parseSecurityEventList,
} from "./parse.ts";
import type {
  HqAuthAttemptList,
  HqDiscoveryDiagnostic,
  HqEnforcementList,
  HqHistoryParams,
  HqMember360,
  HqSecurityEventList,
} from "./types.ts";

/**
 * HQ API client — `/api/v1/hq/*` only.
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
    if (error.code === "profile_unavailable") {
      return "This member has no profile on this brand yet.";
    }
    return "No matching member was found for this brand.";
  }
  if (error.status === 422) {
    if (error.code === "invalid_cursor") {
      return "That page cursor is no longer valid. Start again from the first page.";
    }
    if (error.code === "invalid_limit") {
      return "That page size is not allowed.";
    }
    return "The request was rejected. Check the lookup or paging parameters.";
  }
  if (error.status >= 500 || error.message.startsWith("invalid_hq_")) {
    return "The HQ API returned an unexpected response.";
  }
  return "The HQ request failed. Try again.";
}
