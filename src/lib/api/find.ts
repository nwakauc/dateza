import { ApiError } from "./errors.ts";
import { apiRequest } from "./client.ts";
import type {
  DatezaCompatibility,
  DatezaCompatibilityReason,
  FindAllowance,
  FindFilters,
  FindProfile,
  FindResponse,
  LikeResponse,
  PassResponse,
  ProfileDetail,
  ProfileDetailResponse,
  ProfileInterest,
  PromptAnswer,
  PublicProfile,
  PublicProfilePhoto,
} from "./findTypes.ts";

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

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parsePhoto(value: unknown): PublicProfilePhoto | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.position !== "number" ||
    typeof value.url !== "string" ||
    typeof value.url_expires_in !== "number"
  ) {
    return undefined;
  }
  return { id: value.id, position: value.position, url: value.url, url_expires_in: value.url_expires_in };
}

function parseOptions(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) {
    return {};
  }
  const options: Record<string, string[]> = {};
  for (const [key, codes] of Object.entries(value)) {
    options[key] = asStringArray(codes);
  }
  return options;
}

export function parsePublicProfile(value: unknown): PublicProfile {
  if (!isRecord(value) || typeof value.id !== "string") {
    throw new ApiError(502, undefined, "invalid_profile_response");
  }
  return {
    id: value.id,
    display_name: asStringOrNull(value.display_name),
    age: asNumberOrNull(value.age),
    bio: asStringOrNull(value.bio),
    gender: asStringOrNull(value.gender),
    pronouns: asStringOrNull(value.pronouns),
    country_code: asStringOrNull(value.country_code),
    city: asStringOrNull(value.city),
    occupation: asStringOrNull(value.occupation),
    job_title: asStringOrNull(value.job_title),
    school_or_institution: asStringOrNull(value.school_or_institution),
    looking_for_text: asStringOrNull(value.looking_for_text),
    height_cm: asNumberOrNull(value.height_cm),
    body_type: asStringOrNull(value.body_type),
    languages_spoken: asStringArray(value.languages_spoken),
    smoking: asStringOrNull(value.smoking),
    drinking: asStringOrNull(value.drinking),
    fitness: asStringOrNull(value.fitness),
    photos: Array.isArray(value.photos) ? value.photos.map(parsePhoto).filter((p) => p !== undefined) : [],
    options: parseOptions(value.options),
  };
}

const COMPATIBILITY_REASONS = new Set<string>([
  "shared_long_term_intent",
  "compatible_relationship_goals",
  "relationship_goal_mismatch",
  "compatible_family_plans",
  "family_plan_mismatch",
  "shared_no_smoking",
  "smoking_lifestyle_mismatch",
  "compatible_drinking_style",
  "similar_faith_importance",
  "similar_social_style",
  "compatible_meeting_pace",
  "shared_interests",
  "shared_languages",
  "compatible_communication_style",
  "compatible_planning_style",
  "similar_travel_style",
  "compatible_diet",
]);

function parseCompatibility(value: unknown): DatezaCompatibility {
  if (
    !isRecord(value) ||
    typeof value.score !== "number" ||
    typeof value.confidence !== "number" ||
    (value.confidence_level !== "low" && value.confidence_level !== "medium" && value.confidence_level !== "high")
  ) {
    return null;
  }
  const reasons = Array.isArray(value.reasons)
    ? value.reasons.filter(
        (reason): reason is DatezaCompatibilityReason =>
          typeof reason === "string" && COMPATIBILITY_REASONS.has(reason),
      )
    : [];
  return {
    score: value.score,
    confidence: value.confidence,
    confidence_level: value.confidence_level,
    version: "dateza_v1",
    reasons,
  };
}

function parseFindProfile(value: unknown): FindProfile {
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
  };
}

function parseAllowance(value: unknown): FindAllowance {
  if (
    !isRecord(value) ||
    typeof value.limit !== "number" ||
    typeof value.used !== "number" ||
    typeof value.remaining !== "number" ||
    typeof value.resets_at !== "string"
  ) {
    throw new ApiError(502, undefined, "invalid_find_response");
  }
  return {
    limit: value.limit,
    used: value.used,
    remaining: value.remaining,
    exhausted: asBoolean(value.exhausted, value.remaining <= 0),
    resets_at: value.resets_at,
  };
}

function buildQuery(filters: FindFilters): string {
  const params = new URLSearchParams();
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.min_age) params.set("min_age", String(filters.min_age));
  if (filters.max_age) params.set("max_age", String(filters.max_age));
  if (filters.max_distance_km) params.set("max_distance_km", String(filters.max_distance_km));
  if (filters.relationship_intent) params.set("relationship_intent", filters.relationship_intent);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** GET /api/v1/find — DateZA's Find surface (see findTypes.ts). Not Discovery. */
export function getFindProfiles(filters: FindFilters = {}): Promise<FindResponse> {
  return apiRequest(`/api/v1/find${buildQuery(filters)}`).then((data) => {
    if (!isRecord(data) || !Array.isArray(data.profiles)) {
      throw new ApiError(502, undefined, "invalid_find_response");
    }
    return {
      profiles: data.profiles.map(parseFindProfile),
      next_cursor: asStringOrNull(data.next_cursor),
      allowance: parseAllowance(data.allowance),
    };
  });
}

function parsePromptAnswer(value: unknown): PromptAnswer | undefined {
  if (
    !isRecord(value) ||
    typeof value.key !== "string" ||
    typeof value.prompt !== "string" ||
    typeof value.answer !== "string" ||
    typeof value.position !== "number"
  ) {
    return undefined;
  }
  return { key: value.key, prompt: value.prompt, answer: value.answer, position: value.position };
}

function parseInterest(value: unknown): ProfileInterest | undefined {
  if (!isRecord(value) || typeof value.slug !== "string" || typeof value.label !== "string") {
    return undefined;
  }
  return { slug: value.slug, label: value.label, category: asStringOrNull(value.category) };
}

function parseProfileDetail(value: unknown): ProfileDetail {
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
    hook_tonight_active: asBoolean(record.hook_tonight_active, false),
    hook_state:
      record.hook_state === "available" ||
      record.hook_state === "pending" ||
      record.hook_state === "hooked" ||
      record.hook_state === "unavailable"
        ? record.hook_state
        : "unavailable",
    prompts: Array.isArray(record.prompts) ? record.prompts.map(parsePromptAnswer).filter((p) => p !== undefined) : [],
    interests: Array.isArray(record.interests)
      ? record.interests.map(parseInterest).filter((i) => i !== undefined)
      : [],
  };
}

/** GET /api/v1/profiles/{profile_id} */
export function getProfileDetail(profileId: string): Promise<ProfileDetailResponse> {
  return apiRequest(`/api/v1/profiles/${encodeURIComponent(profileId)}`).then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_profile_response");
    }
    return { profile: parseProfileDetail(data.profile) };
  });
}

/** POST /api/v1/profiles/{profile_id}/likes — idempotent. */
export function likeProfile(profileId: string): Promise<LikeResponse> {
  return apiRequest(`/api/v1/profiles/${encodeURIComponent(profileId)}/likes`, { method: "POST" }).then((data) => {
    if (!isRecord(data) || data.liked !== true || typeof data.created !== "boolean") {
      throw new ApiError(502, undefined, "invalid_like_response");
    }
    return {
      liked: true,
      matched: asBoolean(data.matched, false),
      match_id: asStringOrNull(data.match_id),
      created: data.created,
    };
  });
}

/** POST /api/v1/profiles/{profile_id}/pass — idempotent. */
export function passProfile(profileId: string): Promise<PassResponse> {
  return apiRequest(`/api/v1/profiles/${encodeURIComponent(profileId)}/pass`, { method: "POST" }).then((data) => {
    if (!isRecord(data) || data.passed !== true || typeof data.created !== "boolean") {
      throw new ApiError(502, undefined, "invalid_pass_response");
    }
    return { passed: true, created: data.created };
  });
}
