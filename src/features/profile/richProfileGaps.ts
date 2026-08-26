import type { OwnerProfile } from "../../lib/api/profileTypes.ts";

/**
 * DateZA richness is not onboarding publication. `onboarding.completion` and
 * `publication_completion` only mean the member can appear in Discover/Find.
 * These slots are the public profile people actually date from, read from
 * GET /profile (+ owner photos). No invented D8N score: filled/total is a
 * count of these slots.
 */
const TARGET_PHOTOS = 3;

type Slot = {
  key: string;
  label: string;
  filled: (profile: OwnerProfile, photoCount: number) => boolean;
};

const SLOTS: readonly Slot[] = [
  {
    key: "more_photos",
    label: "Add more photos",
    filled: (_profile, photoCount) => photoCount >= TARGET_PHOTOS,
  },
  {
    key: "bio",
    label: "Write your bio",
    filled: (profile) => Boolean(profile.bio?.trim()),
  },
  {
    key: "prompts",
    label: "Write a prompt",
    filled: (profile) => profile.prompts.length > 0,
  },
  {
    key: "interests",
    label: "Add interests",
    filled: (profile) => (profile.options.interests ?? []).length > 0,
  },
  {
    key: "looking_for",
    label: "Tell people what you're looking for",
    filled: (profile) =>
      Boolean(profile.looking_for_text?.trim()) || (profile.options.relationship_intent ?? []).length > 0,
  },
  {
    key: "work_or_education",
    label: "Add work or education",
    filled: (profile) =>
      Boolean(profile.occupation?.trim() || profile.job_title?.trim() || profile.school_or_institution?.trim()),
  },
  {
    key: "lifestyle",
    label: "Share your lifestyle",
    filled: (profile) =>
      Boolean(profile.smoking || profile.drinking || profile.fitness) ||
      (profile.options.diet ?? []).length > 0 ||
      (profile.options.pets ?? []).length > 0,
  },
  {
    key: "languages",
    label: "Add languages",
    filled: (profile) => profile.languages_spoken.length > 0,
  },
];

export type DatezaRichness = {
  filled: number;
  total: number;
  percent: number;
  items: { key: string; label: string }[];
};

export function datezaRichness(profile: OwnerProfile | null, photoCount: number): DatezaRichness {
  const total = SLOTS.length;
  if (!profile) {
    return {
      filled: 0,
      total,
      percent: 0,
      items: SLOTS.slice(0, 4).map(({ key, label }) => ({ key, label })),
    };
  }

  const missing = SLOTS.filter((slot) => !slot.filled(profile, photoCount));
  const filled = total - missing.length;
  return {
    filled,
    total,
    percent: Math.round((filled / total) * 100),
    items: missing.slice(0, 4).map(({ key, label }) => ({ key, label })),
  };
}

export function isDatezaProfileRich(profile: OwnerProfile | null, photoCount: number): boolean {
  const richness = datezaRichness(profile, photoCount);
  return richness.filled >= richness.total;
}
