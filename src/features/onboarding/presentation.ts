import type { FieldOption } from "../../lib/api/profileTypes.ts";

/**
 * Past this many options a wrapped pill group stops being scannable and a
 * native picker is the better control. Only genuinely large catalogues
 * (countries, languages) exceed it.
 */
export const MAX_PILL_OPTIONS = 12;

/**
 * Email / Phone style: a single-row pill holder. Past three options the set
 * wraps, the last chip stretches, and the holder stops looking like a control.
 * Larger sets use a chip cloud instead.
 */
export const MAX_SEGMENTED_OPTIONS = 3;

/** Broadest values ProfilePreference currently accepts (18–120, 1–500 km). */
export const BROAD_PREFERENCE_DEFAULTS = {
  min_age: 18,
  max_age: 120,
  max_distance_km: 500,
} as const;

/**
 * DateZA matching and onboarding tests store these gender strings. The profile
 * API does not publish a gender catalogue, so this is presentation of that
 * known vocabulary — not a client-invented matching rule.
 */
export const DATEZA_GENDER_CHOICES: FieldOption[] = [
  { code: "woman", label: "Woman" },
  { code: "man", label: "Man" },
];

export const DATEZA_INTERESTED_IN_CHOICES: FieldOption[] = [
  { code: "woman", label: "Women" },
  { code: "man", label: "Men" },
];

const SMOKING_COPY: Record<string, { label: string; hint: string }> = {
  never: { label: "Never", hint: "I don’t smoke" },
  occasionally: { label: "Sometimes", hint: "Socially, or now and then" },
  regularly: { label: "Regularly", hint: "Most days" },
};

const DRINKING_COPY: Record<string, { label: string; hint: string }> = {
  never: { label: "Never", hint: "I don’t drink" },
  occasionally: { label: "Sometimes", hint: "Socially, or now and then" },
  regularly: { label: "Regularly", hint: "Most days" },
};

/**
 * The relationship_intent and wants_children option groups (D8N option
 * catalogue) ship with sentence-length labels. DateZA displays short,
 * scannable copy for the same codes — the codes sent back to D8N never
 * change, only what the member reads on the chip.
 */
const OPTION_GROUP_LABEL_OVERRIDES: Record<string, Record<string, string>> = {
  relationship_intent: {
    long_term_relationship: "Long term",
    open_to_dating: "Dating",
    friendship: "Friends",
    still_figuring_it_out: "Figuring it out",
  },
  wants_children: {
    open_to_partner_with_children: "Partner has kids",
  },
};

export function optionGroupChoices(groupKey: string, serverOptions: FieldOption[]): FieldOption[] {
  const overrides = OPTION_GROUP_LABEL_OVERRIDES[groupKey];
  if (!overrides) {
    return serverOptions;
  }
  return serverOptions.map((option) =>
    overrides[option.code] ? { ...option, label: overrides[option.code] } : option,
  );
}

export function genderChoices(serverOptions: FieldOption[]): FieldOption[] {
  return serverOptions.length > 0 ? serverOptions : DATEZA_GENDER_CHOICES;
}

export function interestedInChoices(serverOptions: FieldOption[]): FieldOption[] {
  return serverOptions.length > 0 ? serverOptions : DATEZA_INTERESTED_IN_CHOICES;
}

export function lifestyleChoices(
  key: "smoking" | "drinking",
  serverOptions: FieldOption[],
): Array<FieldOption & { hint?: string }> {
  const copy = key === "smoking" ? SMOKING_COPY : DRINKING_COPY;
  const source = serverOptions.length > 0 ? serverOptions : Object.keys(copy).map((code) => ({
    code,
    label: copy[code]?.label ?? code,
  }));
  return source.map((option) => {
    const overlay = copy[option.code];
    return overlay ? { ...option, label: overlay.label, hint: overlay.hint } : option;
  });
}

const ISO_3166_1_ALPHA_2 = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
  "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
  "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
  "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
  "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
  "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
  "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
  "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
  "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
  "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
  "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
  "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
  "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
  "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW",
] as const;

export function countryChoices(): FieldOption[] {
  const displayNames = new Intl.DisplayNames(["en-ZA", "en"], { type: "region" });
  const labelled = ISO_3166_1_ALPHA_2.map((code) => ({
    code,
    label: displayNames.of(code) ?? code,
  }));
  labelled.sort((left, right) => {
    if (left.code === "ZA") {
      return -1;
    }
    if (right.code === "ZA") {
      return 1;
    }
    return left.label.localeCompare(right.label, "en-ZA");
  });
  return labelled;
}
