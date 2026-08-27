import { ApiError } from "./errors.ts";
import { apiRequest } from "./client.ts";
import type { BrandSummary } from "./types.ts";
import type {
  ConfiguredCollection,
  ConfiguredField,
  ConfiguredOptionGroup,
  ConfiguredPrompt,
  CurrentProfileResponse,
  FieldOption,
  OwnerProfile,
  OwnerProfileLocation,
  OwnerProfilePlace,
  ProfileCompletion,
  ProfileCompletionSection,
  ProfileCompletionSuggestion,
  ProfileConfiguration,
  ProfileConfigurationResponse,
  ProfileLocationPlace,
  ProfileLocationStatus,
  ProfileLocationUpdateBody,
  ProfileOnboardingStatus,
  ProfilePreferences,
  ProfileUpdateBody,
} from "./profileTypes.ts";
import type { PromptAnswer } from "./findTypes.ts";
import { parsePromptAnswer } from "./find.ts";
import { parseConfiguredOpeners } from "./opener.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asStringOrNull(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  return typeof value === "string" ? value : null;
}

function asNumberOrNull(value: unknown): number | null {
  if (value === null) {
    return null;
  }
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function parseBrand(value: unknown): BrandSummary {
  if (!isRecord(value) || typeof value.slug !== "string" || typeof value.name !== "string") {
    throw new ApiError(502, undefined, "invalid_profile_response");
  }
  return { slug: value.slug, name: value.name };
}

function parseCompletion(value: unknown): ProfileOnboardingStatus["completion"] {
  if (!isRecord(value) || typeof value.complete !== "boolean" || typeof value.percent !== "number") {
    throw new ApiError(502, undefined, "invalid_onboarding_response");
  }
  if (!Array.isArray(value.missing) || !value.missing.every((item) => typeof item === "string")) {
    throw new ApiError(502, undefined, "invalid_onboarding_response");
  }
  return { complete: value.complete, percent: value.percent, missing: value.missing };
}

const ONBOARDING_STATES = new Set([
  "profile_required",
  "profile_incomplete",
  "ready_to_publish",
  "complete",
  "profile_suspended",
]);
const ONBOARDING_STEPS = new Set([
  "profile",
  "preferences",
  "photos",
  "location",
  "options",
  "publication",
]);

export function parseOnboardingStatus(value: unknown): ProfileOnboardingStatus {
  if (!isRecord(value)) {
    throw new ApiError(502, undefined, "invalid_onboarding_response");
  }
  const state = asString(value.state);
  const nextStep = value.next_step === null ? null : asString(value.next_step);
  const profileExists = asBoolean(value.profile_exists);
  const profileComplete = asBoolean(value.profile_complete);
  const profilePublished = asBoolean(value.profile_published);
  if (
    state === undefined ||
    !ONBOARDING_STATES.has(state) ||
    (nextStep !== null && (nextStep === undefined || !ONBOARDING_STEPS.has(nextStep))) ||
    profileExists === undefined ||
    profileComplete === undefined ||
    profilePublished === undefined
  ) {
    throw new ApiError(502, undefined, "invalid_onboarding_response");
  }
  return {
    state: state as ProfileOnboardingStatus["state"],
    next_step: nextStep as ProfileOnboardingStatus["next_step"],
    profile_exists: profileExists,
    profile_complete: profileComplete,
    profile_published: profilePublished,
    completion: parseCompletion(value.completion),
  };
}

function parseOptionsMap(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) {
    return {};
  }
  const selections: Record<string, string[]> = {};
  for (const [key, codes] of Object.entries(value)) {
    if (Array.isArray(codes) && codes.every((code) => typeof code === "string")) {
      selections[key] = codes;
    }
  }
  return selections;
}

function parseProfileCompletion(value: unknown): ProfileCompletion | null {
  if (!isRecord(value) || typeof value.percent !== "number" || !Number.isFinite(value.percent)) {
    return null;
  }
  const missing = Array.isArray(value.missing) ? value.missing.filter((item): item is string => typeof item === "string") : [];
  const suggestions: ProfileCompletionSuggestion[] = Array.isArray(value.suggestions)
    ? value.suggestions.flatMap((item) => {
        if (!isRecord(item) || typeof item.key !== "string" || typeof item.label !== "string") {
          return [];
        }
        return [{ key: item.key, label: item.label }];
      })
    : [];
  const sections: Record<string, ProfileCompletionSection> = {};
  if (isRecord(value.sections)) {
    for (const [key, section] of Object.entries(value.sections)) {
      if (isRecord(section) && typeof section.percent === "number" && typeof section.complete === "boolean") {
        sections[key] = { percent: section.percent, complete: section.complete };
      }
    }
  }
  return {
    percent: value.percent,
    level: typeof value.level === "string" ? value.level : "",
    missing,
    suggestions,
    sections,
  };
}

function parseLanguageList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const languages: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item) {
      languages.push(item);
      continue;
    }
    if (!isRecord(item)) continue;
    if (typeof item.code === "string" && item.code) languages.push(item.code);
    else if (typeof item.name === "string" && item.name) languages.push(item.name);
    else if (typeof item.label === "string" && item.label) languages.push(item.label);
  }
  return languages;
}

function parsePromptList(value: unknown): PromptAnswer[] {
  return Array.isArray(value) ? value.map(parsePromptAnswer).filter((item): item is PromptAnswer => item !== undefined) : [];
}

function parseOwnerContactVerified(value: unknown): boolean | null {
  if (!isRecord(value) || !isRecord(value.contact) || typeof value.contact.verified !== "boolean") {
    return null;
  }
  return value.contact.verified;
}

function parseOwnerProfile(value: unknown): OwnerProfile {
  if (!isRecord(value) || typeof value.id !== "string") {
    throw new ApiError(502, undefined, "invalid_profile_response");
  }
  const languagesSpoken = parseLanguageList(value.languages_spoken);
  const languages = languagesSpoken.length > 0 ? languagesSpoken : parseLanguageList(value.languages);
  return {
    id: value.id,
    brand: parseBrand(value.brand),
    status: asString(value.status) ?? "draft",
    visibility: asString(value.visibility) ?? "hidden",
    first_name: asStringOrNull(value.first_name),
    last_name: asStringOrNull(value.last_name),
    display_name: asStringOrNull(value.display_name),
    bio: asStringOrNull(value.bio),
    birthdate: asStringOrNull(value.birthdate),
    gender: asStringOrNull(value.gender),
    country_code: asStringOrNull(value.country_code),
    city: asStringOrNull(value.city),
    occupation: asStringOrNull(value.occupation),
    job_title: asStringOrNull(value.job_title),
    school_or_institution: asStringOrNull(value.school_or_institution),
    looking_for_text: asStringOrNull(value.looking_for_text),
    company_name: asStringOrNull(value.company_name),
    height_cm: asNumberOrNull(value.height_cm),
    smoking: asStringOrNull(value.smoking),
    drinking: asStringOrNull(value.drinking),
    fitness: asStringOrNull(value.fitness),
    languages_spoken: languages,
    options: parseOptionsMap(value.options),
    prompts: parsePromptList(value.prompts),
    contact_verified: parseOwnerContactVerified(value.verification),
    publication_completion: isRecord(value.publication_completion) ? parseCompletion(value.publication_completion) : null,
    profile_completion: parseProfileCompletion(value.profile_completion),
    location: parseOwnerLocation(value.location),
  };
}

function parseOwnerPlace(value: unknown): OwnerProfilePlace | null {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.display_path !== "string") {
    return null;
  }
  return { name: value.name, display_path: value.display_path };
}

function parseOwnerLocation(value: unknown): OwnerProfileLocation | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value) || typeof value.configured !== "boolean") {
    return undefined;
  }
  return {
    configured: value.configured,
    place: parseOwnerPlace(value.place),
  };
}

function parseFieldOption(value: unknown): FieldOption | undefined {
  if (!isRecord(value) || typeof value.code !== "string" || typeof value.label !== "string") {
    return undefined;
  }
  return {
    code: value.code,
    label: value.label,
    category: asStringOrNull(value.category),
  };
}

const INPUT_TYPES = new Set([
  "text",
  "textarea",
  "date",
  "integer",
  "select",
  "string_list",
  "language_list",
]);

function parseConfiguredField(value: unknown): ConfiguredField | undefined {
  if (!isRecord(value) || typeof value.key !== "string" || typeof value.label !== "string") {
    return undefined;
  }
  const inputType = asString(value.input_type);
  const cardinality = asString(value.cardinality);
  if (
    typeof value.required !== "boolean" ||
    inputType === undefined ||
    !INPUT_TYPES.has(inputType) ||
    (cardinality !== "single" && cardinality !== "multiple")
  ) {
    return undefined;
  }
  const options = Array.isArray(value.options)
    ? value.options.map(parseFieldOption).filter((option) => option !== undefined)
    : [];
  return {
    key: value.key,
    label: value.label,
    required: value.required,
    cardinality,
    input_type: inputType as ConfiguredField["input_type"],
    visibility: asString(value.visibility) ?? "public_profile",
    options,
  };
}

function parseOptionGroup(value: unknown): ConfiguredOptionGroup | undefined {
  if (!isRecord(value) || typeof value.key !== "string" || typeof value.label !== "string") {
    return undefined;
  }
  const cardinality = asString(value.cardinality);
  if (
    typeof value.required !== "boolean" ||
    typeof value.max_selections !== "number" ||
    (cardinality !== "single" && cardinality !== "multiple")
  ) {
    return undefined;
  }
  const options = Array.isArray(value.options)
    ? value.options.map(parseFieldOption).filter((option) => option !== undefined)
    : [];
  return {
    key: value.key,
    label: value.label,
    cardinality,
    max_selections: value.max_selections,
    required: value.required,
    visibility: asString(value.visibility) ?? "public_profile",
    options,
  };
}

function parseCollection(value: unknown): ConfiguredCollection | undefined {
  if (
    !isRecord(value) ||
    typeof value.key !== "string" ||
    typeof value.label !== "string" ||
    typeof value.required !== "boolean" ||
    typeof value.minimum_count !== "number"
  ) {
    return undefined;
  }
  return {
    key: value.key,
    label: value.label,
    required: value.required,
    minimum_count: value.minimum_count,
    maximum_count: typeof value.maximum_count === "number" ? value.maximum_count : undefined,
  };
}

function parseConfiguredPrompt(value: unknown): ConfiguredPrompt | undefined {
  if (!isRecord(value) || typeof value.key !== "string") {
    return undefined;
  }
  const text = asString(value.text) ?? asString(value.prompt);
  if (!text) {
    return undefined;
  }
  return {
    key: value.key,
    text,
    category: asStringOrNull(value.category),
  };
}

function parseConfiguration(value: unknown): ProfileConfiguration {
  if (!isRecord(value)) {
    throw new ApiError(502, undefined, "invalid_configuration_response");
  }
  const identityFields = Array.isArray(value.identity_fields)
    ? value.identity_fields.map(parseConfiguredField).filter((field) => field !== undefined)
    : [];
  const profileFields = Array.isArray(value.profile_fields)
    ? value.profile_fields.map(parseConfiguredField).filter((field) => field !== undefined)
    : [];
  const preferenceFields = Array.isArray(value.preference_fields)
    ? value.preference_fields.map(parseConfiguredField).filter((field) => field !== undefined)
    : [];
  const collections = Array.isArray(value.collections)
    ? value.collections.map(parseCollection).filter((item) => item !== undefined)
    : [];
  const optionGroups = Array.isArray(value.option_groups)
    ? value.option_groups.map(parseOptionGroup).filter((group) => group !== undefined)
    : [];
  const rawPrompts = Array.isArray(value.prompts)
    ? value.prompts
    : Array.isArray(value.prompt_definitions)
      ? value.prompt_definitions
      : [];
  const prompts = rawPrompts.map(parseConfiguredPrompt).filter((prompt) => prompt !== undefined);
  return {
    identity_fields: identityFields,
    profile_fields: profileFields,
    preference_fields: preferenceFields,
    collections,
    option_groups: optionGroups,
    prompts,
    openers: parseConfiguredOpeners(value.openers ?? value.configured_openers),
  };
}

export function getProfileConfiguration(): Promise<ProfileConfigurationResponse> {
  return apiRequest("/api/v1/profile/configuration").then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_configuration_response");
    }
    return {
      configuration: parseConfiguration(data.configuration),
      onboarding: parseOnboardingStatus(data.onboarding),
    };
  });
}

export function getCurrentProfile(): Promise<CurrentProfileResponse> {
  return apiRequest("/api/v1/profile").then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_profile_response");
    }
    return {
      profile: data.profile === null ? null : parseOwnerProfile(data.profile),
      onboarding: parseOnboardingStatus(data.onboarding),
    };
  });
}

export function updateCurrentProfile(body: ProfileUpdateBody): Promise<CurrentProfileResponse> {
  return apiRequest("/api/v1/profile", jsonInit("PATCH", body)).then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_profile_response");
    }
    return {
      profile: data.profile === null ? null : parseOwnerProfile(data.profile),
      onboarding: parseOnboardingStatus(data.onboarding),
    };
  });
}

export function getProfilePreferences(): Promise<ProfilePreferences | null> {
  return apiRequest("/api/v1/profile/preferences").then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_preferences_response");
    }
    if (data.preferences === null) {
      return null;
    }
    if (!isRecord(data.preferences)) {
      throw new ApiError(502, undefined, "invalid_preferences_response");
    }
    const interested = data.preferences.interested_in;
    return {
      min_age: asNumberOrNull(data.preferences.min_age),
      max_age: asNumberOrNull(data.preferences.max_age),
      max_distance_km: asNumberOrNull(data.preferences.max_distance_km),
      interested_in: Array.isArray(interested)
        ? interested.filter((item): item is string => typeof item === "string")
        : [],
    };
  });
}

export function updateProfilePreferences(body: {
  min_age: number;
  max_age: number;
  max_distance_km: number;
  interested_in: string[];
}): Promise<void> {
  return apiRequest("/api/v1/profile/preferences", jsonInit("PATCH", body)).then(() => undefined);
}

export function replaceProfileOptions(selections: Record<string, string[]>): Promise<void> {
  return apiRequest(
    "/api/v1/profile/options",
    jsonInit("PATCH", { selections }),
  ).then(() => undefined);
}

export function getOwnerPrompts(): Promise<PromptAnswer[]> {
  return apiRequest("/api/v1/profile/prompts").then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_prompts_response");
    }
    if (Array.isArray(data.prompts)) {
      return parsePromptList(data.prompts);
    }
    if (Array.isArray(data.answers)) {
      return parsePromptList(data.answers);
    }
    if (isRecord(data.profile)) {
      return parsePromptList(data.profile.prompts);
    }
    return [];
  });
}

export function replaceOwnerPrompts(answers: Array<{ key: string; answer: string }>): Promise<PromptAnswer[]> {
  return apiRequest("/api/v1/profile/prompts", jsonInit("PUT", { answers })).then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_prompts_response");
    }
    if (isRecord(data.profile)) {
      return parsePromptList(data.profile.prompts);
    }
    if (Array.isArray(data.prompts)) {
      return parsePromptList(data.prompts);
    }
    return answers.map((item, position) => ({
      key: item.key,
      prompt: item.key,
      answer: item.answer,
      position,
    }));
  });
}

export function publishCurrentProfile(): Promise<void> {
  return apiRequest("/api/v1/profile/publication", { method: "POST" }).then(() => undefined);
}

export function unpublishCurrentProfile(): Promise<void> {
  return apiRequest("/api/v1/profile/publication", { method: "DELETE" }).then(() => undefined);
}

function parseLocationPlace(value: unknown): ProfileLocationPlace | null {
  if (!isRecord(value) || typeof value.name !== "string" || typeof value.display_path !== "string") {
    return null;
  }
  const id = typeof value.id === "number" && Number.isInteger(value.id) ? value.id : null;
  return { id, name: value.name, display_path: value.display_path };
}

function parseLocationStatus(value: unknown): ProfileLocationStatus {
  if (!isRecord(value) || typeof value.configured !== "boolean") {
    throw new ApiError(502, undefined, "invalid_location_response");
  }
  return {
    configured: value.configured,
    accuracy_meters: asNumberOrNull(value.accuracy_meters),
    source: asStringOrNull(value.source),
    captured_at: asStringOrNull(value.captured_at),
    place: parseLocationPlace(value.place),
  };
}

/**
 * GET /api/v1/profile/location — authoritative dating-location state.
 * `configured` is identical to GET /profile `location.configured`. Never
 * includes coordinates.
 */
export function getProfileLocation(): Promise<ProfileLocationStatus> {
  return apiRequest("/api/v1/profile/location").then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_location_response");
    }
    return parseLocationStatus(data.location);
  });
}

/**
 * PUT /api/v1/profile/location — device GPS write used by onboarding until
 * backend T10 hardens precision. D8N never echoes coordinates back
 * (confirmed against staging 2026-08-25).
 */
export function updateProfileLocation(body: ProfileLocationUpdateBody): Promise<ProfileLocationStatus> {
  return apiRequest("/api/v1/profile/location", jsonInit("PUT", body)).then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_location_response");
    }
    return parseLocationStatus(data.location);
  });
}

/**
 * PUT /api/v1/profile/place — member-selected dating area. Body is
 * `{ place_id }` only; the server resolves the Place centroid. Response
 * `location.place` is the authoritative saved label.
 */
export function updateProfilePlace(placeId: number): Promise<ProfileLocationStatus> {
  return apiRequest("/api/v1/profile/place", jsonInit("PUT", { place_id: placeId })).then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_location_response");
    }
    return parseLocationStatus(data.location);
  });
}

/**
 * After a successful location write, re-read GET /profile/location so the UI
 * never treats a local PUT payload as authority. If readback fails, the
 * write result is kept so a network blip does not look like an unconfigured
 * member.
 */
export async function confirmSavedLocation(written: ProfileLocationStatus): Promise<ProfileLocationStatus> {
  if (!written.configured) return written;
  try {
    const latest = await getProfileLocation();
    return latest.configured ? latest : written;
  } catch {
    return written;
  }
}
