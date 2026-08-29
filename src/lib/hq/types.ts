/**
 * D8N HQ Phase 1 types — aligned with docs/api/openapi.yaml (tag: Hq).
 * Do not invent fields the contract does not define.
 */

export type HqMembershipStatus = "active" | "suspended" | "left" | "deactivated";
export type HqUserStatus = "active" | "suspended" | "closed";

export type HqMemberSummary = {
  user_id: number;
  profile_id: string | null;
  brand: string;
  membership_status: HqMembershipStatus;
};

export type HqIdentifier = {
  kind: "email" | "phone";
  value: string;
  verified_at: string | null;
  last_seen_at: string | null;
};

export type HqSession = {
  device_name: string | null;
  ip_address: string | null;
  last_used_at: string;
  expires_at: string;
  revoked_at: string | null;
};

export type HqIdentitySection = {
  user_id: number;
  user_status: HqUserStatus;
  first_name: string | null;
  last_name: string | null;
  user_created_at: string;
  membership_status: HqMembershipStatus;
  member_since: string;
  identifiers: HqIdentifier[];
  recent_sessions: HqSession[];
};

export type HqProfilePhoto = {
  id: string;
  position: number;
  status: "pending_review" | "approved" | "rejected";
  visibility: "hidden" | "visible";
  processing_state: "pending" | "processing" | "ready" | "failed";
};

export type HqProfilePreference = {
  min_age: number | null;
  max_age: number | null;
  max_distance_km: number | null;
  relationship_intent: string | null;
  interested_in: string[];
  country: string | null;
};

/** When exists === false, every other property is absent (not null). */
export type HqProfileSection =
  | { exists: false }
  | {
      exists: true;
      public_id: string;
      display_name: string | null;
      status: "draft" | "active" | "suspended";
      visibility: "hidden" | "visible";
      gender: string | null;
      birthdate: string | null;
      country_code: string | null;
      city: string | null;
      created_at: string;
      onboarding_state:
        | "profile_required"
        | "profile_incomplete"
        | "ready_to_publish"
        | "complete"
        | "profile_suspended";
      onboarding_next_step: string | null;
      onboarding_completion_percent: number;
      photo_count: number;
      photos: HqProfilePhoto[];
      preference: HqProfilePreference | null;
    };

export type HqConversationSummary = {
  id: string;
  status: "active" | "closed";
  created_at: string;
};

export type HqProductSection = {
  likes_given: number;
  likes_received: number;
  matches_active: number;
  hooks_sent: number;
  hooks_received: number;
  hooks_live_sent: number;
  hooks_live_received: number;
  hook_tonight_live: boolean;
  conversations_count: number;
  recent_conversations: HqConversationSummary[];
  blocks_given: number;
  blocks_received: number;
};

export type HqDelivery = {
  channel: "sms" | "email" | "push" | "whatsapp" | "in_app";
  status: "pending" | "sent" | "failed" | "skipped" | "processing";
  provider: string;
  sent_at: string | null;
  failed_at: string | null;
  error_code: string | null;
  created_at: string;
};

export type HqCommsSection = {
  delivery_counts_by_status: Record<string, number>;
  delivery_counts_by_channel: Record<string, number>;
  recent_deliveries: HqDelivery[];
};

export type HqAdminEnforcement = {
  id: number;
  state: "active" | "reverted";
  profile_id: string | null;
  reason: string | null;
  report_id: number | null;
  admin_user_id: number;
  reverted_by_admin_user_id: number | null;
  created_at: string;
  reverted_at: string | null;
};

export type HqRecentReport = {
  id: number;
  status: "open" | "reviewing" | "actioned" | "dismissed";
  reason: string;
  target_type: "profile" | "message" | "profile_media" | "hook" | "conversation";
  direction: "filed" | "received";
  created_at: string;
};

export type HqAccountClosure = {
  media_purge_state: "pending" | "completed" | "failed";
  created_at: string;
};

export type HqSafetySection = {
  reports_filed_count: number;
  reports_received_count: number;
  recent_reports: HqRecentReport[];
  active_enforcement: HqAdminEnforcement | null;
  enforcement_count: number;
  account_closure: HqAccountClosure | null;
};

export type HqAuthAttemptKind =
  | "password"
  | "email_otp"
  | "phone_otp"
  | "oauth"
  | "webauthn"
  | "recovery_code";

export type HqAuthAttemptResult = "succeeded" | "failed" | "throttled" | "locked";

export type HqRecentAuthAttempt = {
  kind: HqAuthAttemptKind;
  result: HqAuthAttemptResult;
  ip_address: string | null;
  created_at: string;
};

export type HqSecuritySeverity = "info" | "warning" | "high" | "critical";

export type HqRecentSecurityEvent = {
  event_type: string;
  severity: HqSecuritySeverity;
  created_at: string;
};

export type HqActivitySection = {
  last_login_at: string | null;
  recent_auth_attempts: HqRecentAuthAttempt[];
  recent_security_events: HqRecentSecurityEvent[];
};

export type HqMember360 = {
  member: HqMemberSummary;
  sections: {
    identity: HqIdentitySection;
    profile: HqProfileSection;
    product: HqProductSection;
    comms: HqCommsSection;
    safety: HqSafetySection;
    activity: HqActivitySection;
  };
};

export type HqSecurityEvent = {
  id: number;
  event_type: string;
  severity: HqSecuritySeverity;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
};

export type HqSecurityEventList = {
  security_events: HqSecurityEvent[];
  next_cursor: string | null;
};

export type HqAuthAttempt = {
  id: number;
  kind: HqAuthAttemptKind;
  result: HqAuthAttemptResult;
  identifier: string;
  ip_address: string | null;
  created_at: string;
};

export type HqAuthAttemptList = {
  auth_attempts: HqAuthAttempt[];
  next_cursor: string | null;
};

export type HqEnforcementList = {
  enforcements: HqAdminEnforcement[];
  next_cursor: string | null;
};

export type HqDiscoveryStageName =
  | "visible_active_profiles"
  | "reciprocal_gender_age_distance"
  | "final_eligible_candidates";

export type HqDiscoveryStage = {
  stage: HqDiscoveryStageName;
  description: string;
  candidate_count: number;
};

export type HqDiscoveryDiagnostic = {
  eligible: boolean;
  ineligibility_reason: string | null;
  stages: HqDiscoveryStage[];
};

export type HqHistoryParams = {
  cursor?: string | null;
  limit?: number;
};
