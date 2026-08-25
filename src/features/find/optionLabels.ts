import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";

/**
 * `FindProfile.options` (and `ProfileDetail.options`) only carry raw D8N
 * option codes (e.g. "long_term_relationship") — the human labels live in
 * `configuration.option_groups`, the same catalogue onboarding already
 * fetches via `getProfileConfiguration()`. This builds one lookup instead
 * of re-deriving group->code->label per card render.
 */
export type OptionLabelLookup = (groupKey: string, code: string) => string | undefined;

export function buildOptionLabelLookup(configuration: ProfileConfiguration | undefined): OptionLabelLookup {
  const byGroup = new Map<string, Map<string, string>>();
  for (const group of configuration?.option_groups ?? []) {
    byGroup.set(group.key, new Map(group.options.map((option) => [option.code, option.label])));
  }
  return (groupKey, code) => byGroup.get(groupKey)?.get(code);
}
