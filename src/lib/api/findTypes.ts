/**
 * Shapes copied from the verified D8N OpenAPI contract
 * (`d8n/docs/api/openapi.yaml`: PublicProfile, ProfileStatus, FindProfile,
 * FindResponse, ProfileDetail, LikeResponse, PassResponse). Do not extend
 * these with client-invented fields.
 *
 * DateZA's product-facing "Find" screen (exploratory browsing, 10 profiles/day)
 * is built on `GET /api/v1/find`, not `GET /api/v1/discovery`. The latter is
 * HookUs's `for_you`/`new_here` feed and is deliberately unconfigured for the
 * `dateza` brand per the openapi.yaml "Implementation status" preamble —
 * calling it for DateZA returns 404 `matching_not_configured`.
 *
 * "Discovery" is DateZA's curated, recommendation-led surface (10/day),
 * backed by its own endpoint (`GET /api/v1/discovery` — see discovery.ts /
 * discoveryTypes.ts). It is a separate product and allowance from Find and
 * must never be wired to `/api/v1/find` or vice versa.
 */

export type PublicProfilePhoto = {
  id: string;
  position: number;
  url: string;
  url_expires_in: number;
};

/**
 * Safe public profile. Never includes `first_name`/`last_name` — D8N does
 * not serialize them here, and the frontend must not either.
 */
export type PublicProfile = {
  id: string;
  display_name: string | null;
  age: number | null;
  bio: string | null;
  gender: string | null;
  pronouns: string | null;
  country_code: string | null;
  city: string | null;
  occupation: string | null;
  job_title: string | null;
  school_or_institution: string | null;
  looking_for_text: string | null;
  height_cm: number | null;
  body_type: string | null;
  languages_spoken: string[];
  smoking: string | null;
  drinking: string | null;
  fitness: string | null;
  photos: PublicProfilePhoto[];
  options: Record<string, string[]>;
};

export type FindProfileStatus = {
  /** Contact (email/phone) verification only — not RealMe photo/identity
   * verification, which does not exist yet. Treat as "reachable", not a
   * strong trust badge. */
  verified: boolean;
  online: boolean;
  active_today: boolean;
  new_here: boolean;
  last_active_at: string | null;
  distance_km: number | null;
};

export type DatezaCompatibilityReason =
  | "shared_long_term_intent"
  | "compatible_relationship_goals"
  | "relationship_goal_mismatch"
  | "compatible_family_plans"
  | "family_plan_mismatch"
  | "shared_no_smoking"
  | "smoking_lifestyle_mismatch"
  | "compatible_drinking_style"
  | "similar_faith_importance"
  | "similar_social_style"
  | "compatible_meeting_pace"
  | "shared_interests"
  | "shared_languages"
  | "compatible_communication_style"
  | "compatible_planning_style"
  | "similar_travel_style"
  | "compatible_diet";

/** null means comparable input is below the publication threshold
 * — it does NOT mean incompatibility. */
export type DatezaCompatibility = {
  score: number;
  confidence: number;
  confidence_level: "low" | "medium" | "high";
  version: string;
  reasons: DatezaCompatibilityReason[];
} | null;

export type FindProfile = PublicProfile &
  FindProfileStatus & {
    compatibility: DatezaCompatibility;
  };

export type FindAllowance = {
  limit: number;
  used: number;
  remaining: number;
  exhausted: boolean;
  /** Next midnight in Africa/Johannesburg, including its UTC offset. */
  resets_at: string;
};

export type FindResponse = {
  profiles: FindProfile[];
  next_cursor: string | null;
  allowance: FindAllowance;
};

export type ProfileStatus = FindProfileStatus & {
  hook_tonight_active: boolean;
  hook_state: "available" | "pending" | "hooked" | "unavailable";
};

export type PromptAnswer = {
  key: string;
  prompt: string;
  answer: string;
  position: number;
};

export type ProfileInterest = {
  slug: string;
  label: string;
  category: string | null;
};

export type ProfileDetail = PublicProfile &
  ProfileStatus & {
    prompts: PromptAnswer[];
    interests: ProfileInterest[];
    /**
     * DateZA compatibility payload. Present on public detail after the
     * rich-profile contract; null when comparable input is insufficient.
     * Confidence/version are parsed for mapping fidelity and must not be shown.
     */
    compatibility: DatezaCompatibility;
  };

export type ProfileDetailResponse = {
  profile: ProfileDetail;
};

export type LikeResponse = {
  liked: true;
  matched: boolean;
  match_id: string | null;
  created: boolean;
};

export type PassResponse = {
  passed: true;
  created: boolean;
};

export type FindFilters = {
  cursor?: string;
  limit?: number;
  min_age?: number;
  max_age?: number;
  max_distance_km?: number;
  relationship_intent?: string;
};
