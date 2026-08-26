import type { ProfileDetail } from "../../lib/api/findTypes.ts";
import { lifestyleChoices } from "../onboarding/presentation.ts";
import type { OptionLabelLookup } from "../find/optionLabels.ts";

export type ProfileFact = { key: string; label: string; value: string };

const INTENT_GROUPS = ["relationship_intent", "marriage_intent"] as const;
const LIFESTYLE_GROUPS = ["diet", "pets", "travel", "travel_frequency", "sleep_schedule"] as const;
const PERSONALITY_GROUPS = ["social_style", "communication_style", "planning_style"] as const;
const EDUCATION_GROUPS = ["education", "education_level"] as const;
const HIDDEN_GROUPS = new Set([
  "has_children",
  "wants_children",
  "children_count",
  "religion",
  "religion_importance",
  "physical_affection",
  "chemistry_importance",
  "interests",
]);

function humanize(code: string): string {
  return code
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ");
}

function fieldLabelValue(
  key: "smoking" | "drinking",
  code: string,
  fieldLabel: OptionLabelLookup,
): string {
  return fieldLabel(key, code) ?? lifestyleChoices(key, []).find((option) => option.code === code)?.label ?? humanize(code);
}

function optionValues(
  profile: ProfileDetail,
  groupKey: string,
  optionLabel: OptionLabelLookup,
): string[] {
  return (profile.options[groupKey] ?? [])
    .map((code) => optionLabel(groupKey, code))
    .filter((label): label is string => Boolean(label));
}

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export const MAX_PROFILE_INTERESTS = 12;

export function formatLanguages(languages: string[]): string {
  return joinList(languages);
}

export function matchHeadline(score: number): string {
  if (score >= 80) return "Great match";
  if (score >= 60) return "Good match";
  return "Compatible";
}

export function identityLocation(profile: ProfileDetail): string | undefined {
  const place = [profile.city, profile.country_code].filter(Boolean).join(", ");
  const distance = profile.distance_km != null ? `${profile.distance_km} km away` : undefined;
  if (place && distance) return `${place} · ${distance}`;
  return place || distance;
}

export function intentFacts(profile: ProfileDetail, optionLabel: OptionLabelLookup): ProfileFact[] {
  const facts: ProfileFact[] = [];
  for (const group of INTENT_GROUPS) {
    const values = optionValues(profile, group, optionLabel);
    if (values.length > 0) {
      facts.push({ key: group, label: group === "marriage_intent" ? "Marriage" : "Looking for", value: values.join(" · ") });
    }
  }
  return facts;
}

export function aboutFacts(profile: ProfileDetail, fieldLabel: OptionLabelLookup, optionLabel: OptionLabelLookup): ProfileFact[] {
  const facts: ProfileFact[] = [];
  if (profile.height_cm) {
    facts.push({ key: "height", label: "Height", value: `${profile.height_cm} cm` });
  }
  for (const group of EDUCATION_GROUPS) {
    const values = optionValues(profile, group, optionLabel);
    if (values.length > 0) {
      facts.push({ key: group, label: "Education", value: values.join(" · ") });
    }
  }
  if (profile.school_or_institution) {
    facts.push({ key: "school", label: "School", value: profile.school_or_institution });
  }
  if (profile.body_type) {
    facts.push({
      key: "body_type",
      label: "Body type",
      value: fieldLabel("body_type", profile.body_type) ?? humanize(profile.body_type),
    });
  }
  return facts;
}

export function workFacts(profile: ProfileDetail): ProfileFact[] {
  const facts: ProfileFact[] = [];
  if (profile.job_title) facts.push({ key: "job_title", label: "Job", value: profile.job_title });
  if (profile.occupation) facts.push({ key: "occupation", label: "Work", value: profile.occupation });
  return facts;
}

export function lifestyleFacts(profile: ProfileDetail, fieldLabel: OptionLabelLookup, optionLabel: OptionLabelLookup): ProfileFact[] {
  const facts: ProfileFact[] = [];
  if (profile.smoking) {
    facts.push({ key: "smoking", label: "Smoking", value: fieldLabelValue("smoking", profile.smoking, fieldLabel) });
  }
  if (profile.drinking) {
    facts.push({ key: "drinking", label: "Drinking", value: fieldLabelValue("drinking", profile.drinking, fieldLabel) });
  }
  if (profile.fitness) {
    facts.push({ key: "fitness", label: "Activity", value: fieldLabel("fitness", profile.fitness) ?? humanize(profile.fitness) });
  }
  for (const group of LIFESTYLE_GROUPS) {
    const values = optionValues(profile, group, optionLabel);
    if (values.length > 0) {
      const labels: Record<string, string> = {
        diet: "Diet",
        pets: "Pets",
        travel: "Travel",
        travel_frequency: "Travel",
        sleep_schedule: "Sleep",
      };
      facts.push({ key: group, label: labels[group] ?? humanize(group), value: values.join(" · ") });
    }
  }
  return facts;
}

export function personalityFacts(profile: ProfileDetail, optionLabel: OptionLabelLookup): ProfileFact[] {
  const facts: ProfileFact[] = [];
  const labels: Record<string, string> = {
    social_style: "Social style",
    communication_style: "Communication",
    planning_style: "Planning",
  };
  for (const group of PERSONALITY_GROUPS) {
    const values = optionValues(profile, group, optionLabel);
    if (values.length > 0) {
      facts.push({ key: group, label: labels[group] ?? humanize(group), value: values.join(" · ") });
    }
  }
  return facts;
}

export function moreFacts(profile: ProfileDetail, optionLabel: OptionLabelLookup): ProfileFact[] {
  const claimed = new Set<string>([...INTENT_GROUPS, ...LIFESTYLE_GROUPS, ...PERSONALITY_GROUPS, ...EDUCATION_GROUPS, ...HIDDEN_GROUPS]);
  const facts: ProfileFact[] = [];
  for (const [group, codes] of Object.entries(profile.options)) {
    if (claimed.has(group) || codes.length === 0) continue;
    const values = codes.map((code) => optionLabel(group, code)).filter((label): label is string => Boolean(label));
    if (values.length === 0) continue;
    facts.push({ key: group, label: humanize(group), value: values.join(" · ") });
  }
  if (profile.languages_spoken.length > 0) {
    facts.push({ key: "languages", label: "Languages", value: formatLanguages(profile.languages_spoken) });
  }
  return facts;
}

export function interestLabels(profile: ProfileDetail): string[] {
  return profile.interests.map((interest) => interest.label).filter(Boolean).slice(0, MAX_PROFILE_INTERESTS);
}

export function summaryPills(
  profile: ProfileDetail,
  optionLabel: OptionLabelLookup,
  compatibilityScore: number | undefined,
): string[] {
  const pills: string[] = [];
  if (compatibilityScore != null) pills.push(`${compatibilityScore}% compatible`);
  const intent = optionValues(profile, "relationship_intent", optionLabel)[0];
  if (intent) pills.push(intent);
  return pills;
}
