import type { ProfileOnboardingStatus } from "../../lib/api/profileTypes.ts";

/**
 * Confirmed against the D8N source (`d8n/domains/profiles/dateza_profile_catalog.rb`
 * `REQUIRED_IDENTITY_FIELDS`, 2026-08-23): DateZA requires exactly `first_name`
 * and `last_name` as private identity fields, always served first in
 * `configuration.identity_fields` and in `completion.missing`.
 */
const IDENTITY_KEYS = ["first_name", "last_name"] as const;
const BASICS_KEYS = ["display_name", "birthdate", "gender"] as const;
const WHERE_KEYS = ["country_code", "city"] as const;
/** Not a profile field D8N accepts via PATCH /profile — this is the same
 * top-level "location" key completion.missing uses for a still-unset
 * ProfileLocation. LocationStep saves via PUT /profile/place (dating area)
 * or PUT /profile/location (device GPS, until backend T10). Mapping it into
 * a screen here reuses the same "resume at the first still-missing screen"
 * logic as every other profile screen. */
const LOCATION_KEYS = ["location"] as const;
const ABOUT_KEYS = ["bio"] as const;
const LIFESTYLE_KEYS = ["smoking", "drinking"] as const;

export type ProfileScreen = "identity" | "basics" | "where" | "location" | "about" | "lifestyle";

export const PROFILE_SCREEN_ORDER: readonly ProfileScreen[] = [
  "identity",
  "basics",
  "where",
  "location",
  "about",
  "lifestyle",
];

export function memberDestination(
  status: ProfileOnboardingStatus,
): "/discover" | "/home" | "/onboarding" {
  if (status.state === "profile_suspended") {
    return "/home";
  }
  if (status.state === "complete") {
    // FE-01 (2026-08-24): registration → onboarding → Discover → verification
    // is the intended new-member journey, so a completed member lands on
    // Discover. Discover itself still has no curated-picks backend and shows
    // an honest "coming soon" placeholder with a link into Find — that
    // separation is unchanged, only the post-onboarding landing page moved.
    return "/discover";
  }
  return "/onboarding";
}

/** Resumes at the first screen with a still-missing field, so a refresh
 * mid-flow lands the member back where they left off. */
export function profileScreenForMissing(missing: string[]): ProfileScreen {
  for (const screen of PROFILE_SCREEN_ORDER) {
    if (PROFILE_SCREEN_KEYS[screen].some((key) => missing.includes(key))) {
      return screen;
    }
  }
  return "lifestyle";
}

export const PROFILE_SCREEN_KEYS: Record<ProfileScreen, readonly string[]> = {
  identity: IDENTITY_KEYS,
  basics: BASICS_KEYS,
  where: WHERE_KEYS,
  location: LOCATION_KEYS,
  about: ABOUT_KEYS,
  lifestyle: LIFESTYLE_KEYS,
};

/**
 * The "options" onboarding step delivers a flat, server-ordered list of
 * required option groups (relationship_intent, has_children,
 * wants_children, religion_importance, social_style, meeting_pace for
 * DateZA today). The server has no per-group screen/section concept, so
 * this is DateZA's own grouping of those groups into short, coherent
 * questions rather than one long wall. Any group key the server adds
 * later that we don't recognise falls into the last, most general
 * screen instead of silently disappearing.
 */
export type OptionsScreen = "intent" | "family" | "more";

export const OPTIONS_SCREEN_ORDER: readonly OptionsScreen[] = [
  "intent",
  "family",
  "more",
];

const OPTIONS_SCREEN_BY_GROUP_KEY: Record<string, OptionsScreen> = {
  relationship_intent: "intent",
  has_children: "family",
  wants_children: "family",
  religion_importance: "more",
  social_style: "more",
  meeting_pace: "more",
};

/** completion.missing namespaces option-group entries as "options.<key>"
 * (e.g. "options.relationship_intent"), while configuration.option_groups
 * exposes the bare key ("relationship_intent"). Accept either. */
function bareGroupKey(key: string): string {
  const prefix = "options.";
  return key.startsWith(prefix) ? key.slice(prefix.length) : key;
}

export function optionsScreenForGroup(groupKey: string): OptionsScreen {
  return OPTIONS_SCREEN_BY_GROUP_KEY[bareGroupKey(groupKey)] ?? "more";
}

/**
 * meeting_pace ("how soon do you like to meet?") is required by D8N today,
 * but it's too much detail for onboarding — it belongs in the richer
 * profile/preferences experience a member reaches after onboarding. DateZA
 * hides the question here and submits a default silently so onboarding
 * still completes; members can change it later. It stays mapped to "more"
 * above so a refresh with only meeting_pace missing still resumes on the
 * right screen instead of looping.
 */
export const HIDDEN_OPTIONS_GROUP_KEYS: ReadonlySet<string> = new Set(["meeting_pace"]);

/**
 * Confirmed against DateZA staging's /api/v1/profile/configuration
 * (2026-08-23): this is the code behind "Go with the flow" in the
 * meeting_pace option group. Not invented — read from the live contract.
 */
const MEETING_PACE_GO_WITH_THE_FLOW_CODE = "go_with_the_flow";

/** Falls back to the group's last listed option if the confirmed code ever
 * disappears from the catalogue, so a hidden required group can never
 * silently block onboarding completion. */
export function hiddenGroupDefaultSelection(options: readonly { code: string }[]): string[] {
  const known = options.find((option) => option.code === MEETING_PACE_GO_WITH_THE_FLOW_CODE);
  if (known) {
    return [known.code];
  }
  const last = options[options.length - 1];
  return last ? [last.code] : [];
}

/** Resumes at the first options screen with a still-missing group, same
 * idea as profileScreenForMissing. Checking screens in order (rather
 * than the group list) means an unrelated missing key can only ever
 * fall through to the last, catch-all screen — it can't cause an
 * earlier screen to be skipped incorrectly. */
export function optionsScreenForMissing(missing: string[]): OptionsScreen {
  for (const screen of OPTIONS_SCREEN_ORDER) {
    if (missing.some((key) => optionsScreenForGroup(key) === screen)) {
      return screen;
    }
  }
  return "intent";
}
