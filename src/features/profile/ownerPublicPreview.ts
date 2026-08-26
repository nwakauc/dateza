import type { OwnerPhoto } from "../../lib/api/photoTypes.ts";
import type { ProfileDetail, ProfileInterest, PromptAnswer } from "../../lib/api/findTypes.ts";
import type { OwnerProfile, ProfileConfiguration } from "../../lib/api/profileTypes.ts";

export const HIDDEN_OWNER_OPTIONS = new Set([
  "has_children",
  "wants_children",
  "children_count",
  "religion",
  "religion_importance",
  "physical_affection",
  "chemistry_importance",
]);

function interestPreview(profile: OwnerProfile, configuration?: ProfileConfiguration): ProfileInterest[] {
  const codes = profile.options.interests ?? [];
  const group = configuration?.option_groups.find((item) => item.key === "interests");
  const labels = new Map((group?.options ?? []).map((option) => [option.code, option]));
  return codes.map((slug) => {
    const option = labels.get(slug);
    return {
      slug,
      label: option?.label ?? slug,
      category: option?.category ?? null,
    };
  });
}

function promptPreview(prompts: PromptAnswer[]): PromptAnswer[] {
  return [...prompts].sort((left, right) => left.position - right.position);
}

/**
 * Approximate public view from owner data when GET /profiles/:id is
 * unavailable. Omits owner-only fields so the preview stays close to what
 * other members would see.
 */
export function ownerPublicPreview(
  profile: OwnerProfile,
  photos: OwnerPhoto[],
  age: number | null,
  configuration?: ProfileConfiguration,
): ProfileDetail {
  const publicOptions: Record<string, string[]> = {};
  for (const [key, codes] of Object.entries(profile.options)) {
    if (!HIDDEN_OWNER_OPTIONS.has(key)) publicOptions[key] = codes;
  }
  return {
    id: profile.id,
    display_name: profile.display_name,
    age,
    bio: profile.bio,
    gender: profile.gender,
    pronouns: null,
    country_code: profile.country_code,
    city: profile.city,
    occupation: profile.occupation,
    job_title: profile.job_title,
    school_or_institution: profile.school_or_institution,
    looking_for_text: profile.looking_for_text,
    height_cm: profile.height_cm,
    body_type: null,
    languages_spoken: profile.languages_spoken,
    smoking: profile.smoking,
    drinking: profile.drinking,
    fitness: profile.fitness,
    photos: photos
      .filter((photo) => photo.image)
      .map((photo) => ({
        id: String(photo.id),
        position: photo.position,
        primary: photo.primary,
        url: photo.image!.url,
        url_expires_in: photo.image!.url_expires_in,
      }))
      .sort((left, right) => left.position - right.position)
      .map((photo, index) => ({ ...photo, position: index })),
    options: publicOptions,
    verified: profile.contact_verified === true,
    online: false,
    active_today: false,
    new_here: false,
    last_active_at: null,
    distance_km: null,
    hook_tonight_active: false,
    hook_state: "unavailable",
    prompts: promptPreview(profile.prompts),
    interests: interestPreview(profile, configuration),
    compatibility: null,
  };
}

/**
 * Owner "how you appear" must use public visibility and must not show
 * viewer-relative signals (compatibility, distance, presence).
 */
export function forOwnerPreview(profile: ProfileDetail): ProfileDetail {
  const publicOptions: Record<string, string[]> = {};
  for (const [key, codes] of Object.entries(profile.options)) {
    if (!HIDDEN_OWNER_OPTIONS.has(key)) publicOptions[key] = codes;
  }
  return {
    ...profile,
    options: publicOptions,
    distance_km: null,
    compatibility: null,
    online: false,
    active_today: false,
    last_active_at: null,
    new_here: false,
  };
}
