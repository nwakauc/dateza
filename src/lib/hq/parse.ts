import { ApiError } from "../api/errors.ts";
import type {
  HqAccountClosure,
  HqAdminEnforcement,
  HqAuthAttempt,
  HqAuthAttemptKind,
  HqAuthAttemptList,
  HqAuthAttemptResult,
  HqCommsSection,
  HqDelivery,
  HqDiscoveryDiagnostic,
  HqDiscoveryStage,
  HqDiscoveryStageName,
  HqEnforcementList,
  HqIdentitySection,
  HqIdentifier,
  HqMember360,
  HqMemberSummary,
  HqMembershipStatus,
  HqProductSection,
  HqProfilePhoto,
  HqProfilePreference,
  HqProfileSection,
  HqRecentAuthAttempt,
  HqRecentReport,
  HqRecentSecurityEvent,
  HqSafetySection,
  HqSecurityEvent,
  HqSecurityEventList,
  HqSecuritySeverity,
  HqSession,
  HqUserStatus,
  HqActivitySection,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new ApiError(502, undefined, `invalid_hq_${label}`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new ApiError(502, undefined, `invalid_hq_${label}`);
  }
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ApiError(502, undefined, `invalid_hq_${label}`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new ApiError(502, undefined, `invalid_hq_${label}`);
  }
  return value;
}

function nullableString(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value === "string") return value;
  throw new ApiError(502, undefined, "invalid_hq_nullable_string");
}

function parseMembershipStatus(value: unknown): HqMembershipStatus {
  if (value === "active" || value === "suspended" || value === "left" || value === "deactivated") {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_membership_status");
}

function parseUserStatus(value: unknown): HqUserStatus {
  if (value === "active" || value === "suspended" || value === "closed") {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_user_status");
}

function parseSeverity(value: unknown): HqSecuritySeverity {
  if (value === "info" || value === "warning" || value === "high" || value === "critical") {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_severity");
}

function parseAuthKind(value: unknown): HqAuthAttemptKind {
  if (
    value === "password" ||
    value === "email_otp" ||
    value === "phone_otp" ||
    value === "oauth" ||
    value === "webauthn" ||
    value === "recovery_code"
  ) {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_auth_kind");
}

function parseAuthResult(value: unknown): HqAuthAttemptResult {
  if (value === "succeeded" || value === "failed" || value === "throttled" || value === "locked") {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_auth_result");
}

function parseCountMap(value: unknown, label: string): Record<string, number> {
  const record = requireRecord(value, label);
  const out: Record<string, number> = {};
  for (const [key, entry] of Object.entries(record)) {
    out[key] = requireNumber(entry, `${label}_entry`);
  }
  return out;
}

function parseIdentifier(value: unknown): HqIdentifier {
  const row = requireRecord(value, "identifier");
  const kind = row.kind;
  if (kind !== "email" && kind !== "phone") {
    throw new ApiError(502, undefined, "invalid_hq_identifier_kind");
  }
  return {
    kind,
    value: requireString(row.value, "identifier_value"),
    verified_at: nullableString(row.verified_at),
    last_seen_at: nullableString(row.last_seen_at),
  };
}

function parseSession(value: unknown): HqSession {
  const row = requireRecord(value, "session");
  return {
    device_name: nullableString(row.device_name),
    ip_address: nullableString(row.ip_address),
    last_used_at: requireString(row.last_used_at, "session_last_used"),
    expires_at: requireString(row.expires_at, "session_expires"),
    revoked_at: nullableString(row.revoked_at),
  };
}

function parseIdentity(value: unknown): HqIdentitySection {
  const row = requireRecord(value, "identity");
  if (!Array.isArray(row.identifiers) || !Array.isArray(row.recent_sessions)) {
    throw new ApiError(502, undefined, "invalid_hq_identity");
  }
  return {
    user_id: requireNumber(row.user_id, "identity_user_id"),
    user_status: parseUserStatus(row.user_status),
    first_name: nullableString(row.first_name),
    last_name: nullableString(row.last_name),
    user_created_at: requireString(row.user_created_at, "user_created_at"),
    membership_status: parseMembershipStatus(row.membership_status),
    member_since: requireString(row.member_since, "member_since"),
    identifiers: row.identifiers.map(parseIdentifier),
    recent_sessions: row.recent_sessions.map(parseSession),
  };
}

function parsePhoto(value: unknown): HqProfilePhoto {
  const row = requireRecord(value, "photo");
  const status = row.status;
  const visibility = row.visibility;
  const processing = row.processing_state;
  if (status !== "pending_review" && status !== "approved" && status !== "rejected") {
    throw new ApiError(502, undefined, "invalid_hq_photo_status");
  }
  if (visibility !== "hidden" && visibility !== "visible") {
    throw new ApiError(502, undefined, "invalid_hq_photo_visibility");
  }
  if (
    processing !== "pending" &&
    processing !== "processing" &&
    processing !== "ready" &&
    processing !== "failed"
  ) {
    throw new ApiError(502, undefined, "invalid_hq_photo_processing");
  }
  return {
    id: requireString(row.id, "photo_id"),
    position: requireNumber(row.position, "photo_position"),
    status,
    visibility,
    processing_state: processing,
  };
}

function parsePreference(value: unknown): HqProfilePreference | null {
  if (value === null) return null;
  const row = requireRecord(value, "preference");
  const interested = Array.isArray(row.interested_in)
    ? row.interested_in.filter((item): item is string => typeof item === "string")
    : [];
  return {
    min_age: row.min_age === null || row.min_age === undefined ? null : requireNumber(row.min_age, "min_age"),
    max_age: row.max_age === null || row.max_age === undefined ? null : requireNumber(row.max_age, "max_age"),
    max_distance_km:
      row.max_distance_km === null || row.max_distance_km === undefined
        ? null
        : requireNumber(row.max_distance_km, "max_distance_km"),
    relationship_intent: nullableString(row.relationship_intent),
    interested_in: interested,
    country: nullableString(row.country),
  };
}

function parseProfile(value: unknown): HqProfileSection {
  const row = requireRecord(value, "profile");
  const exists = requireBoolean(row.exists, "profile_exists");
  if (!exists) {
    return { exists: false };
  }
  const status = row.status;
  const visibility = row.visibility;
  const onboarding = row.onboarding_state;
  if (status !== "draft" && status !== "active" && status !== "suspended") {
    throw new ApiError(502, undefined, "invalid_hq_profile_status");
  }
  if (visibility !== "hidden" && visibility !== "visible") {
    throw new ApiError(502, undefined, "invalid_hq_profile_visibility");
  }
  if (
    onboarding !== "profile_required" &&
    onboarding !== "profile_incomplete" &&
    onboarding !== "ready_to_publish" &&
    onboarding !== "complete" &&
    onboarding !== "profile_suspended"
  ) {
    throw new ApiError(502, undefined, "invalid_hq_onboarding_state");
  }
  if (!Array.isArray(row.photos)) {
    throw new ApiError(502, undefined, "invalid_hq_photos");
  }
  return {
    exists: true,
    public_id: requireString(row.public_id, "profile_public_id"),
    display_name: nullableString(row.display_name),
    status,
    visibility,
    gender: nullableString(row.gender),
    birthdate: nullableString(row.birthdate),
    country_code: nullableString(row.country_code),
    city: nullableString(row.city),
    created_at: requireString(row.created_at, "profile_created_at"),
    onboarding_state: onboarding,
    onboarding_next_step: nullableString(row.onboarding_next_step),
    onboarding_completion_percent: requireNumber(row.onboarding_completion_percent, "completion_percent"),
    photo_count: requireNumber(row.photo_count, "photo_count"),
    photos: row.photos.map(parsePhoto),
    preference: parsePreference(row.preference ?? null),
  };
}

function parseProduct(value: unknown): HqProductSection {
  const row = requireRecord(value, "product");
  if (!Array.isArray(row.recent_conversations)) {
    throw new ApiError(502, undefined, "invalid_hq_conversations");
  }
  return {
    likes_given: requireNumber(row.likes_given, "likes_given"),
    likes_received: requireNumber(row.likes_received, "likes_received"),
    matches_active: requireNumber(row.matches_active, "matches_active"),
    hooks_sent: requireNumber(row.hooks_sent, "hooks_sent"),
    hooks_received: requireNumber(row.hooks_received, "hooks_received"),
    hooks_live_sent: requireNumber(row.hooks_live_sent, "hooks_live_sent"),
    hooks_live_received: requireNumber(row.hooks_live_received, "hooks_live_received"),
    hook_tonight_live: requireBoolean(row.hook_tonight_live, "hook_tonight_live"),
    conversations_count: requireNumber(row.conversations_count, "conversations_count"),
    recent_conversations: row.recent_conversations.map((item) => {
      const conv = requireRecord(item, "conversation");
      const status = conv.status;
      if (status !== "active" && status !== "closed") {
        throw new ApiError(502, undefined, "invalid_hq_conversation_status");
      }
      return {
        id: requireString(conv.id, "conversation_id"),
        status,
        created_at: requireString(conv.created_at, "conversation_created_at"),
      };
    }),
    blocks_given: requireNumber(row.blocks_given, "blocks_given"),
    blocks_received: requireNumber(row.blocks_received, "blocks_received"),
  };
}

function parseDelivery(value: unknown): HqDelivery {
  const row = requireRecord(value, "delivery");
  const channel = row.channel;
  const status = row.status;
  if (
    channel !== "sms" &&
    channel !== "email" &&
    channel !== "push" &&
    channel !== "whatsapp" &&
    channel !== "in_app"
  ) {
    throw new ApiError(502, undefined, "invalid_hq_delivery_channel");
  }
  if (
    status !== "pending" &&
    status !== "sent" &&
    status !== "failed" &&
    status !== "skipped" &&
    status !== "processing"
  ) {
    throw new ApiError(502, undefined, "invalid_hq_delivery_status");
  }
  return {
    channel,
    status,
    provider: requireString(row.provider, "delivery_provider"),
    sent_at: nullableString(row.sent_at),
    failed_at: nullableString(row.failed_at),
    error_code: nullableString(row.error_code),
    created_at: requireString(row.created_at, "delivery_created_at"),
  };
}

function parseComms(value: unknown): HqCommsSection {
  const row = requireRecord(value, "comms");
  if (!Array.isArray(row.recent_deliveries)) {
    throw new ApiError(502, undefined, "invalid_hq_recent_deliveries");
  }
  return {
    delivery_counts_by_status: parseCountMap(row.delivery_counts_by_status, "delivery_counts_by_status"),
    delivery_counts_by_channel: parseCountMap(row.delivery_counts_by_channel, "delivery_counts_by_channel"),
    recent_deliveries: row.recent_deliveries.map(parseDelivery),
  };
}

export function parseAdminEnforcement(value: unknown): HqAdminEnforcement {
  const row = requireRecord(value, "enforcement");
  const state = row.state;
  if (state !== "active" && state !== "reverted") {
    throw new ApiError(502, undefined, "invalid_hq_enforcement_state");
  }
  return {
    id: requireNumber(row.id, "enforcement_id"),
    state,
    profile_id: nullableString(row.profile_id),
    reason: nullableString(row.reason),
    report_id: row.report_id === null ? null : requireNumber(row.report_id, "report_id"),
    admin_user_id: requireNumber(row.admin_user_id, "admin_user_id"),
    reverted_by_admin_user_id:
      row.reverted_by_admin_user_id === null
        ? null
        : requireNumber(row.reverted_by_admin_user_id, "reverted_by"),
    created_at: requireString(row.created_at, "enforcement_created_at"),
    reverted_at: nullableString(row.reverted_at),
  };
}

function parseReport(value: unknown): HqRecentReport {
  const row = requireRecord(value, "report");
  const status = row.status;
  const target = row.target_type;
  const direction = row.direction;
  if (status !== "open" && status !== "reviewing" && status !== "actioned" && status !== "dismissed") {
    throw new ApiError(502, undefined, "invalid_hq_report_status");
  }
  if (
    target !== "profile" &&
    target !== "message" &&
    target !== "profile_media" &&
    target !== "hook" &&
    target !== "conversation"
  ) {
    throw new ApiError(502, undefined, "invalid_hq_report_target");
  }
  if (direction !== "filed" && direction !== "received") {
    throw new ApiError(502, undefined, "invalid_hq_report_direction");
  }
  return {
    id: requireNumber(row.id, "report_id"),
    status,
    reason: requireString(row.reason, "report_reason"),
    target_type: target,
    direction,
    created_at: requireString(row.created_at, "report_created_at"),
  };
}

function parseSafety(value: unknown): HqSafetySection {
  const row = requireRecord(value, "safety");
  if (!Array.isArray(row.recent_reports)) {
    throw new ApiError(502, undefined, "invalid_hq_recent_reports");
  }
  let closure: HqAccountClosure | null = null;
  if (row.account_closure !== null && row.account_closure !== undefined) {
    const closureRow = requireRecord(row.account_closure, "account_closure");
    const purge = closureRow.media_purge_state;
    if (purge !== "pending" && purge !== "completed" && purge !== "failed") {
      throw new ApiError(502, undefined, "invalid_hq_media_purge_state");
    }
    closure = {
      media_purge_state: purge,
      created_at: requireString(closureRow.created_at, "closure_created_at"),
    };
  }
  return {
    reports_filed_count: requireNumber(row.reports_filed_count, "reports_filed"),
    reports_received_count: requireNumber(row.reports_received_count, "reports_received"),
    recent_reports: row.recent_reports.map(parseReport),
    active_enforcement:
      row.active_enforcement === null ? null : parseAdminEnforcement(row.active_enforcement),
    enforcement_count: requireNumber(row.enforcement_count, "enforcement_count"),
    account_closure: closure,
  };
}

function parseRecentAuth(value: unknown): HqRecentAuthAttempt {
  const row = requireRecord(value, "recent_auth");
  return {
    kind: parseAuthKind(row.kind),
    result: parseAuthResult(row.result),
    ip_address: nullableString(row.ip_address),
    created_at: requireString(row.created_at, "auth_created_at"),
  };
}

function parseRecentSecurity(value: unknown): HqRecentSecurityEvent {
  const row = requireRecord(value, "recent_security");
  return {
    event_type: requireString(row.event_type, "event_type"),
    severity: parseSeverity(row.severity),
    created_at: requireString(row.created_at, "security_created_at"),
  };
}

function parseActivity(value: unknown): HqActivitySection {
  const row = requireRecord(value, "activity");
  if (!Array.isArray(row.recent_auth_attempts) || !Array.isArray(row.recent_security_events)) {
    throw new ApiError(502, undefined, "invalid_hq_activity");
  }
  return {
    last_login_at: nullableString(row.last_login_at),
    recent_auth_attempts: row.recent_auth_attempts.map(parseRecentAuth),
    recent_security_events: row.recent_security_events.map(parseRecentSecurity),
  };
}

function parseMemberSummary(value: unknown): HqMemberSummary {
  const row = requireRecord(value, "member");
  return {
    user_id: requireNumber(row.user_id, "member_user_id"),
    profile_id: nullableString(row.profile_id),
    brand: requireString(row.brand, "member_brand"),
    membership_status: parseMembershipStatus(row.membership_status),
  };
}

export function parseMember360(data: unknown): HqMember360 {
  const root = requireRecord(data, "member_360");
  const sections = requireRecord(root.sections, "sections");
  return {
    member: parseMemberSummary(root.member),
    sections: {
      identity: parseIdentity(sections.identity),
      profile: parseProfile(sections.profile),
      product: parseProduct(sections.product),
      comms: parseComms(sections.comms),
      safety: parseSafety(sections.safety),
      activity: parseActivity(sections.activity),
    },
  };
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new ApiError(502, undefined, "invalid_hq_metadata");
  }
  return value;
}

function parseSecurityEvent(value: unknown): HqSecurityEvent {
  const row = requireRecord(value, "security_event");
  return {
    id: requireNumber(row.id, "security_event_id"),
    event_type: requireString(row.event_type, "security_event_type"),
    severity: parseSeverity(row.severity),
    metadata: parseMetadata(row.metadata),
    ip_address: nullableString(row.ip_address),
    created_at: requireString(row.created_at, "security_event_created_at"),
  };
}

export function parseSecurityEventList(data: unknown): HqSecurityEventList {
  const root = requireRecord(data, "security_event_list");
  if (!Array.isArray(root.security_events)) {
    throw new ApiError(502, undefined, "invalid_hq_security_events");
  }
  return {
    security_events: root.security_events.map(parseSecurityEvent),
    next_cursor: nullableString(root.next_cursor),
  };
}

function parseAuthAttempt(value: unknown): HqAuthAttempt {
  const row = requireRecord(value, "auth_attempt");
  return {
    id: requireNumber(row.id, "auth_attempt_id"),
    kind: parseAuthKind(row.kind),
    result: parseAuthResult(row.result),
    identifier: requireString(row.identifier, "auth_identifier"),
    ip_address: nullableString(row.ip_address),
    created_at: requireString(row.created_at, "auth_attempt_created_at"),
  };
}

export function parseAuthAttemptList(data: unknown): HqAuthAttemptList {
  const root = requireRecord(data, "auth_attempt_list");
  if (!Array.isArray(root.auth_attempts)) {
    throw new ApiError(502, undefined, "invalid_hq_auth_attempts");
  }
  return {
    auth_attempts: root.auth_attempts.map(parseAuthAttempt),
    next_cursor: nullableString(root.next_cursor),
  };
}

export function parseEnforcementList(data: unknown): HqEnforcementList {
  const root = requireRecord(data, "enforcement_list");
  if (!Array.isArray(root.enforcements)) {
    throw new ApiError(502, undefined, "invalid_hq_enforcements");
  }
  return {
    enforcements: root.enforcements.map(parseAdminEnforcement),
    next_cursor: nullableString(root.next_cursor),
  };
}

function parseStageName(value: unknown): HqDiscoveryStageName {
  if (
    value === "visible_active_profiles" ||
    value === "reciprocal_gender_age_distance" ||
    value === "final_eligible_candidates"
  ) {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_discovery_stage");
}

function parseDiscoveryStage(value: unknown): HqDiscoveryStage {
  const row = requireRecord(value, "discovery_stage");
  return {
    stage: parseStageName(row.stage),
    description: requireString(row.description, "stage_description"),
    candidate_count: requireNumber(row.candidate_count, "candidate_count"),
  };
}

export function parseDiscoveryDiagnostic(data: unknown): HqDiscoveryDiagnostic {
  const root = requireRecord(data, "discovery_diagnostic");
  if (!Array.isArray(root.stages)) {
    throw new ApiError(502, undefined, "invalid_hq_discovery_stages");
  }
  return {
    eligible: requireBoolean(root.eligible, "eligible"),
    ineligibility_reason: nullableString(root.ineligibility_reason),
    stages: root.stages.map(parseDiscoveryStage),
  };
}

/** Prefer profile public_id for persistent Member 360 URLs; fall back to original lookup. */
export function memberRouteKey(member: HqMemberSummary, originalLookup: string): string {
  if (member.profile_id) {
    return member.profile_id;
  }
  return originalLookup.trim();
}

export function displayNameForMember(member: HqMember360): string {
  const profile = member.sections.profile;
  if (profile.exists && profile.display_name) {
    return profile.display_name;
  }
  const identity = member.sections.identity;
  const parts = [identity.first_name, identity.last_name].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return member.member.profile_id ?? `User ${member.member.user_id}`;
}
