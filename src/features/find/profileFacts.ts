import type { PublicProfile } from "../../lib/api/findTypes.ts";
import { lifestyleChoices } from "../onboarding/presentation.ts";
import type { OptionLabelLookup } from "./optionLabels.ts";

function humanize(code: string): string {
  return code
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

function lifestyleLabel(key: "smoking" | "drinking", code: string, fieldLabel: OptionLabelLookup): string {
  return fieldLabel(key, code) ?? lifestyleChoices(key, []).find((option) => option.code === code)?.label ?? humanize(code);
}

export type AboutFact = { key: string; label: string; value: string };

type FactSource = Pick<
  PublicProfile,
  "occupation" | "job_title" | "school_or_institution" | "looking_for_text" | "height_cm" | "body_type" | "languages_spoken" | "smoking" | "drinking" | "fitness"
>;

/**
 * Turns the real, currently-unrendered lifestyle/work/education fields on
 * `PublicProfile` into short display facts. Shared by Find's desktop side
 * panel and Profile Detail so both read from the same real data instead of
 * duplicating field-by-field formatting.
 */
export function buildAboutFacts(profile: FactSource, fieldLabel: OptionLabelLookup): AboutFact[] {
  const facts: AboutFact[] = [];
  if (profile.job_title && profile.occupation) {
    facts.push({ key: "work", label: "Work", value: `${profile.job_title} · ${profile.occupation}` });
  } else if (profile.job_title) {
    facts.push({ key: "work", label: "Work", value: profile.job_title });
  } else if (profile.occupation) {
    facts.push({ key: "work", label: "Work", value: profile.occupation });
  }
  if (profile.school_or_institution) {
    facts.push({ key: "education", label: "Education", value: profile.school_or_institution });
  }
  if (profile.height_cm) {
    facts.push({ key: "height", label: "Height", value: `${profile.height_cm} cm` });
  }
  if (profile.body_type) {
    facts.push({ key: "body_type", label: "Body type", value: fieldLabel("body_type", profile.body_type) ?? humanize(profile.body_type) });
  }
  if (profile.smoking) {
    facts.push({ key: "smoking", label: "Smoking", value: lifestyleLabel("smoking", profile.smoking, fieldLabel) });
  }
  if (profile.drinking) {
    facts.push({ key: "drinking", label: "Drinking", value: lifestyleLabel("drinking", profile.drinking, fieldLabel) });
  }
  if (profile.fitness) {
    facts.push({ key: "fitness", label: "Fitness", value: fieldLabel("fitness", profile.fitness) ?? humanize(profile.fitness) });
  }
  if (profile.languages_spoken.length > 0) {
    facts.push({ key: "languages", label: "Languages", value: profile.languages_spoken.join(", ") });
  }
  if (profile.looking_for_text) {
    facts.push({ key: "looking_for", label: "Looking for", value: profile.looking_for_text });
  }
  return facts;
}
