import { ApiError } from "../api/errors.ts";
import type {
  HqAccountClosure,
  HqAdminEnforcement,
  HqAdminReport,
  HqAdminReportList,
  HqAdminReportParty,
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
  HqMemberDirectoryEntry,
  HqMemberDirectoryList,
  HqMemberSummary,
  HqMembershipStatus,
  HqProductSection,
  HqProfilePhoto,
  HqProfilePreference,
  HqProfileSection,
  HqRecentAuthAttempt,
  HqRecentReport,
  HqRecentSecurityEvent,
  HqRepeatOffender,
  HqRepeatOffenderList,
  HqReportReason,
  HqReportStatus,
  HqReportTargetType,
  HqSafetySection,
  HqSecurityEvent,
  HqSecurityEventList,
  HqSecuritySeverity,
  HqSession,
  HqTrustSafetyOverview,
  HqUserStatus,
  HqActivitySection,
  HqCapability,
  HqCurrentOperator,
  HqCurrentOperatorResponse,
  HqMfaChallengeResult,
  HqMfaConfirmation,
  HqMfaEnrollment,
  HqMfaEnrollmentResponse,
  HqMfaLifecycleState,
  HqMfaState,
  HqManagedOperator,
  HqOperatorAssignment,
  HqOperatorRole,
  HqOperatorStatus,
  HqProfilePhotoDerivative,
  HqProfilePhotoModeration,
  HqProfilePhotoModerationResult,
  HqProfilePhotoQueue,
  HqProfilePhotoQueueEntry,
  HqProfileStatus,
  HqProfileVisibility,
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

export function parseAdminEnforcementResponse(data: unknown): HqAdminEnforcement {
  const root = requireRecord(data, "enforcement_response");
  return parseAdminEnforcement(root.enforcement);
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

function parseReportStatus(value: unknown): HqReportStatus {
  if (value === "open" || value === "reviewing" || value === "actioned" || value === "dismissed") {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_report_status");
}

function parseReportReason(value: unknown): HqReportReason {
  if (
    value === "inappropriate_content" ||
    value === "harassment" ||
    value === "spam" ||
    value === "fake_profile" ||
    value === "underage" ||
    value === "other" ||
    value === "violence_or_threat" ||
    value === "non_consensual_content" ||
    value === "impersonation"
  ) {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_report_reason");
}

function parseReportTargetType(value: unknown): HqReportTargetType {
  if (
    value === "profile" ||
    value === "message" ||
    value === "profile_media" ||
    value === "hook" ||
    value === "conversation"
  ) {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_report_target");
}

function parseAdminReportParty(value: unknown): HqAdminReportParty {
  if (value === null) return null;
  const row = requireRecord(value, "report_party");
  return {
    id: requireString(row.id, "report_party_id"),
    display_name: nullableString(row.display_name),
  };
}

function parseEvidence(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new ApiError(502, undefined, "invalid_hq_report_evidence");
  }
  return value;
}

function parseAdminReportBody(value: unknown): HqAdminReport {
  const row = requireRecord(value, "admin_report");
  return {
    id: requireNumber(row.id, "admin_report_id"),
    status: parseReportStatus(row.status),
    reason: parseReportReason(row.reason),
    target_type: parseReportTargetType(row.target_type),
    evidence: parseEvidence(row.evidence),
    reporter: parseAdminReportParty(row.reporter),
    reported: parseAdminReportParty(row.reported),
    note: nullableString(row.note),
    resolution_note: nullableString(row.resolution_note),
    reviewed_by_admin_user_id:
      row.reviewed_by_admin_user_id === null
        ? null
        : requireNumber(row.reviewed_by_admin_user_id, "reviewed_by"),
    reviewed_at: nullableString(row.reviewed_at),
    created_at: requireString(row.created_at, "admin_report_created_at"),
    updated_at: requireString(row.updated_at, "admin_report_updated_at"),
  };
}

/** Accepts either a bare AdminReport or `{ report: AdminReport }`. */
export function parseAdminReport(data: unknown): HqAdminReport {
  const root = requireRecord(data, "admin_report_response");
  if ("report" in root) {
    return parseAdminReportBody(root.report);
  }
  return parseAdminReportBody(root);
}

export function parseAdminReportList(data: unknown): HqAdminReportList {
  const root = requireRecord(data, "admin_report_list");
  if (!Array.isArray(root.reports)) {
    throw new ApiError(502, undefined, "invalid_hq_admin_reports");
  }
  return {
    reports: root.reports.map(parseAdminReportBody),
    next_cursor: nullableString(root.next_cursor),
  };
}

function nullableNumber(value: unknown, label: string): number | null {
  if (value === null) return null;
  return requireNumber(value, label);
}

export function parseTrustSafetyOverview(data: unknown): HqTrustSafetyOverview {
  const root = requireRecord(data, "trust_safety_overview_response");
  const overview = requireRecord(root.overview, "trust_safety_overview");
  const reports = requireRecord(overview.reports, "trust_safety_reports");
  const enforcements = requireRecord(overview.enforcements, "trust_safety_enforcements");
  if (reports.sla_status !== "not_configured") {
    throw new ApiError(502, undefined, "invalid_hq_sla_status");
  }
  // overdue must stay null when null — never coerce to 0
  const overdue = nullableNumber(reports.overdue, "overdue");
  return {
    brand: requireString(overview.brand, "overview_brand"),
    generated_at: requireString(overview.generated_at, "overview_generated_at"),
    reports: {
      total: requireNumber(reports.total, "reports_total"),
      by_status: parseCountMap(reports.by_status, "by_status"),
      awaiting_decision: requireNumber(reports.awaiting_decision, "awaiting_decision"),
      oldest_open_report_at: nullableString(reports.oldest_open_report_at),
      oldest_open_report_age_seconds: nullableNumber(
        reports.oldest_open_report_age_seconds,
        "oldest_open_age",
      ),
      by_reason: parseCountMap(reports.by_reason, "by_reason"),
      by_target_type: parseCountMap(reports.by_target_type, "by_target_type"),
      sla_status: "not_configured",
      overdue,
    },
    enforcements: {
      total: requireNumber(enforcements.total, "enforcements_total"),
      active: requireNumber(enforcements.active, "enforcements_active"),
    },
  };
}

function parseRepeatOffender(value: unknown): HqRepeatOffender {
  const row = requireRecord(value, "repeat_offender");
  return {
    profile_id: requireString(row.profile_id, "repeat_profile_id"),
    display_name: nullableString(row.display_name),
    member_360_lookup: nullableString(row.member_360_lookup),
    report_count: requireNumber(row.report_count, "report_count"),
    awaiting_decision_count: requireNumber(row.awaiting_decision_count, "awaiting_decision_count"),
    latest_report_at: requireString(row.latest_report_at, "latest_report_at"),
  };
}

export function parseRepeatOffenderList(data: unknown): HqRepeatOffenderList {
  const root = requireRecord(data, "repeat_offender_list");
  if (!Array.isArray(root.repeat_offenders)) {
    throw new ApiError(502, undefined, "invalid_hq_repeat_offenders");
  }
  if (root.minimum_reports !== 2) {
    throw new ApiError(502, undefined, "invalid_hq_minimum_reports");
  }
  return {
    repeat_offenders: root.repeat_offenders.map(parseRepeatOffender),
    minimum_reports: 2,
    truncated: requireBoolean(root.truncated, "truncated"),
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

const HQ_CAPABILITIES = new Set<string>([
  "hq.member.sensitive_read",
  "hq.member.security_read",
  "hq.discovery_diagnostics.read",
  "hq.trust_safety.read",
  "admin.reports.read",
  "admin.reports.moderate",
  "admin.enforcements.manage",
  "admin.profile_photos.moderate",
  "admin.operators.read",
  "admin.operators.manage",
  "admin.brand_operations.manage",
  "hq.system.read",
  "hq.analytics.read",
]);

const HQ_OPERATOR_ROLES = new Set<string>([
  "founder",
  "super_admin",
  "operations",
  "trust_safety",
  "support",
  "engineering",
  "marketing",
  "analyst",
  "moderator",
]);

const HQ_OPERATOR_STATUSES = new Set<string>(["active", "suspended", "disabled"]);
const HQ_MFA_STATES = new Set<string>(["not_enrolled", "pending", "active"]);

function parseCapabilityList(value: unknown, label: string): HqCapability[] {
  if (!Array.isArray(value)) {
    throw new ApiError(502, undefined, `invalid_hq_${label}`);
  }
  const capabilities: HqCapability[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !HQ_CAPABILITIES.has(item)) {
      throw new ApiError(502, undefined, `invalid_hq_${label}`);
    }
    if (!capabilities.includes(item as HqCapability)) {
      capabilities.push(item as HqCapability);
    }
  }
  return capabilities;
}

function parseOperatorRole(value: unknown): HqOperatorRole {
  const role = requireString(value, "operator_role");
  if (!HQ_OPERATOR_ROLES.has(role)) {
    throw new ApiError(502, undefined, "invalid_hq_operator_role");
  }
  return role as HqOperatorRole;
}

function parseOperatorStatus(value: unknown): HqOperatorStatus {
  const status = requireString(value, "operator_status");
  if (!HQ_OPERATOR_STATUSES.has(status)) {
    throw new ApiError(502, undefined, "invalid_hq_operator_status");
  }
  return status as HqOperatorStatus;
}

function parseMfaLifecycleState(value: unknown): HqMfaLifecycleState {
  const state = requireString(value, "mfa_state");
  if (!HQ_MFA_STATES.has(state)) {
    throw new ApiError(502, undefined, "invalid_hq_mfa_state");
  }
  return state as HqMfaLifecycleState;
}

function parseMfaState(value: unknown): HqMfaState {
  const row = requireRecord(value, "mfa");
  if (row.required !== true) {
    throw new ApiError(502, undefined, "invalid_hq_mfa_required");
  }
  const recovery = row.recovery_codes_remaining;
  if (recovery !== null && (typeof recovery !== "number" || recovery < 0)) {
    throw new ApiError(502, undefined, "invalid_hq_recovery_codes_remaining");
  }
  return {
    state: parseMfaLifecycleState(row.state),
    required: true,
    verified: requireBoolean(row.verified, "mfa_verified"),
    recovery_codes_remaining: recovery === null ? null : recovery,
  };
}

function parseOperatorAssignment(value: unknown): HqOperatorAssignment {
  const row = requireRecord(value, "operator_assignment");
  return {
    brand: requireString(row.brand, "assignment_brand"),
    role: parseOperatorRole(row.role),
    effective_capabilities: parseCapabilityList(row.effective_capabilities, "assignment_capabilities"),
  };
}

function parseCurrentOperator(value: unknown): HqCurrentOperator {
  const row = requireRecord(value, "operator");
  return {
    admin_user_id: requireNumber(row.admin_user_id, "admin_user_id"),
    user_id: requireNumber(row.user_id, "user_id"),
    status: parseOperatorStatus(row.status),
    current_brand: requireString(row.current_brand, "current_brand"),
    role: parseOperatorRole(row.role),
    effective_capabilities: parseCapabilityList(row.effective_capabilities, "effective_capabilities"),
    grantable_roles: Array.isArray(row.grantable_roles)
      ? row.grantable_roles.map(parseOperatorRole)
      : [],
    brand_assignments: Array.isArray(row.brand_assignments)
      ? row.brand_assignments.map(parseOperatorAssignment)
      : [],
    mfa: parseMfaState(row.mfa),
  };
}

export function parseCurrentOperatorResponse(data: unknown): HqCurrentOperatorResponse {
  const root = requireRecord(data, "current_operator");
  return { operator: parseCurrentOperator(root.operator) };
}

function parseMfaEnrollment(value: unknown): HqMfaEnrollment {
  const row = requireRecord(value, "mfa_enrollment");
  if (row.state !== "pending") {
    throw new ApiError(502, undefined, "invalid_hq_mfa_enrollment_state");
  }
  return {
    state: "pending",
    secret: requireString(row.secret, "mfa_secret"),
    provisioning_uri: requireString(row.provisioning_uri, "mfa_provisioning_uri"),
  };
}

export function parseMfaEnrollmentResponse(data: unknown): HqMfaEnrollmentResponse {
  const root = requireRecord(data, "mfa_enrollment_response");
  return { mfa: parseMfaEnrollment(root.mfa) };
}

export function parseMfaConfirmationResponse(data: unknown): HqMfaConfirmation {
  const root = requireRecord(data, "mfa_confirmation");
  if (!Array.isArray(root.recovery_codes) || root.recovery_codes.length < 8) {
    throw new ApiError(502, undefined, "invalid_hq_recovery_codes");
  }
  const mfa = requireRecord(root.mfa, "mfa_confirmation_state");
  if (mfa.state !== "active" || mfa.verified !== true) {
    throw new ApiError(502, undefined, "invalid_hq_mfa_confirmation_state");
  }
  return {
    mfa: { state: "active", verified: true },
    recovery_codes: root.recovery_codes.map((code) => requireString(code, "recovery_code")),
  };
}

export function parseMfaChallengeResponse(data: unknown): HqMfaChallengeResult {
  const root = requireRecord(data, "mfa_challenge");
  const mfa = requireRecord(root.mfa, "mfa_challenge_state");
  if (mfa.state !== "active" || mfa.verified !== true) {
    throw new ApiError(502, undefined, "invalid_hq_mfa_challenge_state");
  }
  const method = requireString(mfa.method, "mfa_method");
  if (method !== "totp" && method !== "recovery_code") {
    throw new ApiError(502, undefined, "invalid_hq_mfa_method");
  }
  return {
    mfa: {
      state: "active",
      verified: true,
      method,
      recovery_codes_remaining: requireNumber(mfa.recovery_codes_remaining, "recovery_codes_remaining"),
    },
  };
}

function parseProfilePhotoDerivative(value: unknown): HqProfilePhotoDerivative | null {
  if (value === null) return null;
  const row = requireRecord(value, "photo_derivative");
  return {
    content_type: requireString(row.content_type, "photo_content_type"),
    url: requireString(row.url, "photo_url"),
    url_expires_in: requireNumber(row.url_expires_in, "photo_url_expires_in"),
  };
}

function parseProfilePhotoQueueEntry(value: unknown): HqProfilePhotoQueueEntry {
  const row = requireRecord(value, "photo_queue_entry");
  return {
    id: requireString(row.id, "photo_id"),
    profile_id: requireString(row.profile_id, "photo_profile_id"),
    position: requireNumber(row.position, "photo_position"),
    created_at: requireString(row.created_at, "photo_created_at"),
    image: parseProfilePhotoDerivative(row.image),
  };
}

export function parseProfilePhotoQueue(data: unknown): HqProfilePhotoQueue {
  const root = requireRecord(data, "photo_queue");
  if (!Array.isArray(root.photos)) {
    throw new ApiError(502, undefined, "invalid_hq_photo_queue");
  }
  return { photos: root.photos.map(parseProfilePhotoQueueEntry) };
}

function parseProfilePhotoModeration(value: unknown): HqProfilePhotoModeration {
  const row = requireRecord(value, "photo_moderation");
  const status = requireString(row.status, "photo_status");
  if (status !== "approved" && status !== "rejected") {
    throw new ApiError(502, undefined, "invalid_hq_photo_status");
  }
  const visibility = requireString(row.visibility, "photo_visibility");
  if (visibility !== "hidden" && visibility !== "visible") {
    throw new ApiError(502, undefined, "invalid_hq_photo_visibility");
  }
  const processing = requireString(row.processing_state, "photo_processing_state");
  if (
    processing !== "pending" &&
    processing !== "processing" &&
    processing !== "ready" &&
    processing !== "failed"
  ) {
    throw new ApiError(502, undefined, "invalid_hq_photo_processing_state");
  }
  return {
    id: requireString(row.id, "photo_id"),
    profile_id: requireString(row.profile_id, "photo_profile_id"),
    position: requireNumber(row.position, "photo_position"),
    status,
    visibility,
    processing_state: processing,
  };
}

export function parseProfilePhotoModerationResult(data: unknown): HqProfilePhotoModerationResult {
  const root = requireRecord(data, "photo_moderation_result");
  return {
    transitioned: requireBoolean(root.transitioned, "photo_transitioned"),
    photo: parseProfilePhotoModeration(root.photo),
  };
}

function parseManagedOperator(value: unknown): HqManagedOperator {
  const row = requireRecord(value, "managed_operator");
  const assignmentStatus = requireString(row.assignment_status, "assignment_status");
  if (
    assignmentStatus !== "active" &&
    assignmentStatus !== "suspended" &&
    assignmentStatus !== "revoked"
  ) {
    throw new ApiError(502, undefined, "invalid_hq_assignment_status");
  }
  return {
    admin_user_id: requireNumber(row.admin_user_id, "admin_user_id"),
    user_id: requireNumber(row.user_id, "user_id"),
    admin_status: parseOperatorStatus(row.admin_status),
    assignment_status: assignmentStatus,
    role: parseOperatorRole(row.role),
    effective_capabilities: parseCapabilityList(row.effective_capabilities, "operator_capabilities"),
    mfa_enrolled: requireBoolean(row.mfa_enrolled, "mfa_enrolled"),
  };
}

export function parseManagedOperatorResponse(data: unknown): HqManagedOperator {
  const root = requireRecord(data, "managed_operator_response");
  return parseManagedOperator(root.operator);
}

export function parseManagedOperatorList(data: unknown): HqManagedOperator[] {
  const root = requireRecord(data, "managed_operator_list");
  if (!Array.isArray(root.operators)) {
    throw new ApiError(502, undefined, "invalid_hq_operators");
  }
  return root.operators.map(parseManagedOperator);
}

function parseProfileStatus(value: unknown): HqProfileStatus | null {
  if (value === null) return null;
  if (value === "draft" || value === "active" || value === "suspended") {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_profile_status");
}

function parseProfileVisibility(value: unknown): HqProfileVisibility | null {
  if (value === null) return null;
  if (value === "hidden" || value === "visible") {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_hq_profile_visibility");
}

function parseMemberDirectoryEntry(value: unknown): HqMemberDirectoryEntry {
  const row = requireRecord(value, "member_directory_entry");
  return {
    user_id: requireNumber(row.user_id, "member_directory_user_id"),
    profile_id: nullableString(row.profile_id),
    display_name: nullableString(row.display_name),
    user_status: parseUserStatus(row.user_status),
    membership_status: parseMembershipStatus(row.membership_status),
    profile_status: parseProfileStatus(row.profile_status),
    profile_visibility: parseProfileVisibility(row.profile_visibility),
    joined_at: requireString(row.joined_at, "member_directory_joined_at"),
    user_created_at: requireString(row.user_created_at, "member_directory_user_created_at"),
    reports_received_count: requireNumber(row.reports_received_count, "reports_received_count"),
    pending_photo_count: requireNumber(row.pending_photo_count, "pending_photo_count"),
    active_enforcement: requireBoolean(row.active_enforcement, "active_enforcement"),
  };
}

export function parseMemberDirectoryList(data: unknown): HqMemberDirectoryList {
  const root = requireRecord(data, "member_directory_list");
  if (!Array.isArray(root.members)) {
    throw new ApiError(502, undefined, "invalid_hq_member_directory");
  }
  return {
    members: root.members.map(parseMemberDirectoryEntry),
    next_cursor: nullableString(root.next_cursor),
  };
}
