export const EDIT_SECTIONS = [
  { id: "about", label: "About", shortLabel: "About" },
  { id: "photos", label: "Photos", shortLabel: "Photos" },
  { id: "work", label: "Work & Education", shortLabel: "Work" },
  { id: "lifestyle", label: "Lifestyle", shortLabel: "Lifestyle" },
  { id: "dating", label: "Dating", shortLabel: "Dating" },
  { id: "interests", label: "Interests", shortLabel: "Interests" },
  { id: "languages", label: "Languages", shortLabel: "Languages" },
  { id: "prompts", label: "Prompts", shortLabel: "Prompts" },
  { id: "verification", label: "Verification", shortLabel: "Verify" },
  { id: "preview", label: "Preview", shortLabel: "Preview" },
] as const;

export type EditSectionId = (typeof EDIT_SECTIONS)[number]["id"];

/** Older completion hashes and copy still used around the app. */
const HASH_ALIASES: Record<string, EditSectionId> = {
  "looking-for": "about",
  intent: "about",
  family: "dating",
  faith: "dating",
  personality: "dating",
};

export function sectionIdFromHash(hash: string): EditSectionId {
  const raw = hash.replace("#", "");
  if (EDIT_SECTIONS.some((section) => section.id === raw)) {
    return raw as EditSectionId;
  }
  return HASH_ALIASES[raw] ?? "about";
}

export const LIFESTYLE_OPTION_KEYS = ["diet", "pets", "travel", "travel_frequency", "sleep_schedule"] as const;
export const DATING_OPTION_KEYS = [
  "has_children",
  "wants_children",
  "children_count",
  "religion",
  "religion_importance",
  "meeting_pace",
  "physical_affection",
  "chemistry_importance",
  "marriage_intent",
] as const;
export const PERSONALITY_OPTION_KEYS = ["social_style", "communication_style", "planning_style"] as const;
export const EDUCATION_OPTION_KEYS = ["education", "education_level"] as const;
export const INTENT_OPTION_KEYS = ["relationship_intent"] as const;

export const OPTION_KEYS_TO_OMIT = new Set(["languages", "languages_spoken"]);

export const MATCHING_ONLY_KEYS = new Set([
  "has_children",
  "wants_children",
  "children_count",
  "religion",
  "religion_importance",
  "physical_affection",
  "chemistry_importance",
  "company_name",
]);

export function isPublicVisibility(visibility: string): boolean {
  return visibility === "public_profile" || visibility === "public";
}
