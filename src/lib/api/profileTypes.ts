import type { BrandSummary } from "./types.ts";

export type OnboardingState =
  | "profile_required"
  | "profile_incomplete"
  | "ready_to_publish"
  | "complete"
  | "profile_suspended";

export type OnboardingStep =
  | "profile"
  | "preferences"
  | "photos"
  | "options"
  | "publication";

export type Completion = {
  complete: boolean;
  percent: number;
  missing: string[];
};

export type ProfileCompletionSuggestion = {
  key: string;
  label: string;
};

export type ProfileCompletionSection = {
  percent: number;
  complete: boolean;
};

/**
 * Post-onboarding richness score from GET /api/v1/profile.
 * Distinct from `publication_completion` / onboarding `completion`, which
 * gate publishing. Never invent a percent client-side.
 */
export type ProfileCompletion = {
  percent: number;
  level: string;
  missing: string[];
  suggestions: ProfileCompletionSuggestion[];
  sections: Record<string, ProfileCompletionSection>;
};

export type ProfileOnboardingStatus = {
  state: OnboardingState;
  next_step: OnboardingStep | null;
  profile_exists: boolean;
  profile_complete: boolean;
  profile_published: boolean;
  completion: Completion;
};

export type FieldOption = {
  code: string;
  label: string;
  category?: string | null;
};

export type ConfiguredField = {
  key: string;
  label: string;
  required: boolean;
  cardinality: "single" | "multiple";
  input_type: "text" | "textarea" | "date" | "integer" | "select" | "string_list" | "language_list";
  visibility: string;
  options: FieldOption[];
};

export type ConfiguredOptionGroup = {
  key: string;
  label: string;
  cardinality: "single" | "multiple";
  max_selections: number;
  required: boolean;
  visibility: string;
  options: FieldOption[];
};

export type ConfiguredCollection = {
  key: string;
  label: string;
  required: boolean;
  minimum_count: number;
};

export type ProfileConfiguration = {
  identity_fields: ConfiguredField[];
  profile_fields: ConfiguredField[];
  preference_fields: ConfiguredField[];
  collections: ConfiguredCollection[];
  option_groups: ConfiguredOptionGroup[];
};

export type ProfileConfigurationResponse = {
  configuration: ProfileConfiguration;
  onboarding: ProfileOnboardingStatus;
};

export type OwnerProfile = {
  id: string;
  brand: BrandSummary;
  status: string;
  visibility: string;
  /**
   * Private, self-declared platform identity (D8N `ProfileUpdate.first_name`/
   * `last_name`). Never part of public profile JSON — do not surface on
   * Discovery, Find, profile cards, profile detail, matches, or conversations.
   */
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  bio: string | null;
  birthdate: string | null;
  gender: string | null;
  country_code: string | null;
  city: string | null;
  occupation: string | null;
  job_title: string | null;
  school_or_institution: string | null;
  looking_for_text: string | null;
  company_name: string | null;
  height_cm: number | null;
  smoking: string | null;
  drinking: string | null;
  fitness: string | null;
  languages_spoken: string[];
  options: Record<string, string[]>;
  /**
   * Nested contact verification. Treat `verified` here as reachability only,
   * never as RealMe.
   */
  contact_verified: boolean | null;
  publication_completion: Completion | null;
  profile_completion: ProfileCompletion | null;
};

export type CurrentProfileResponse = {
  profile: OwnerProfile | null;
  onboarding: ProfileOnboardingStatus;
};

export type ProfilePreferences = {
  min_age: number | null;
  max_age: number | null;
  interested_in: string[];
  max_distance_km: number | null;
};

export type ProfileUpdateBody = {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  birthdate?: string;
  gender?: string;
  country_code?: string;
  city?: string;
  smoking?: string;
  drinking?: string;
  looking_for_text?: string;
  occupation?: string;
  job_title?: string;
  school_or_institution?: string;
  company_name?: string;
  height_cm?: number | null;
  fitness?: string;
};

export type ProfileLocationUpdateBody = {
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  captured_at: string;
};

/**
 * Confirmed against DateZA staging `PUT /api/v1/profile/location`
 * (2026-08-25): the response never echoes coordinates back, only whether
 * D8N accepted and stored a usable fix.
 */
export type ProfileLocationStatus = {
  configured: boolean;
  accuracy_meters: number | null;
  source: string | null;
  captured_at: string | null;
};
