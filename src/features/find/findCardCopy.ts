import type { FindProfile, PublicProfile } from "../../lib/api/findTypes.ts";
import type { OptionLabelLookup } from "./optionLabels.ts";

const MAX_CARD_CHIPS = 3;
const BIO_EXCERPT_MAX_CHARS = 110;

const FAMILY_OPTION_KEYS = ["family_plans", "wants_children", "children_intent"] as const;
const FAITH_OPTION_KEYS = ["faith_importance", "religion_importance"] as const;

export function placeLine(profile: PublicProfile): string | undefined {
  return profile.city ?? profile.country_code ?? undefined;
}

export function locationLine(profile: FindProfile): string | undefined {
  const place = placeLine(profile);
  const distance = profile.distance_km != null ? `${profile.distance_km} km away` : undefined;
  if (place && distance) return `${place} • ${distance}`;
  return place ?? distance;
}

function firstLabeled(profile: PublicProfile, keys: readonly string[], optionLabel: OptionLabelLookup): string | undefined {
  for (const key of keys) {
    const code = profile.options[key]?.[0];
    if (!code) continue;
    const label = optionLabel(key, code);
    if (label) return label;
  }
  return undefined;
}

export function findCardChips(profile: PublicProfile, optionLabel: OptionLabelLookup): string[] {
  const chips: string[] = [];
  const intentCode = profile.options.relationship_intent?.[0];
  const intent = intentCode ? optionLabel("relationship_intent", intentCode) : undefined;
  if (intent) chips.push(intent.replace(/^long[-\s]term relationship$/i, "Long-term"));

  const family = firstLabeled(profile, FAMILY_OPTION_KEYS, optionLabel);
  if (family) chips.push(family);

  const faith = firstLabeled(profile, FAITH_OPTION_KEYS, optionLabel);
  if (faith) chips.push(faith);

  for (const code of profile.options.interests ?? []) {
    if (chips.length >= MAX_CARD_CHIPS) break;
    const label = optionLabel("interests", code);
    if (label && !chips.includes(label)) chips.push(label);
  }
  return chips.slice(0, MAX_CARD_CHIPS);
}

export function cardQuote(profile: FindProfile): string | undefined {
  const looking = profile.looking_for_text?.trim();
  if (looking) return excerpt(looking);
  const bio = profile.bio?.trim();
  if (bio) return excerpt(bio);
  return undefined;
}

function excerpt(text: string): string {
  if (text.length <= BIO_EXCERPT_MAX_CHARS) return text;
  const cut = text.slice(0, BIO_EXCERPT_MAX_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : BIO_EXCERPT_MAX_CHARS)}…`;
}

export function promptHeading(pronouns: string | null): string {
  const value = pronouns?.toLowerCase() ?? "";
  if (/\bshe\b|\bher\b/.test(value)) return "Her prompt";
  if (/\bhe\b|\bhim\b/.test(value)) return "His prompt";
  return "A prompt";
}
