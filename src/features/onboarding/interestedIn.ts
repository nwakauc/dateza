import type { FieldOption } from "../../lib/api/profileTypes.ts";
import { interestedInChoices } from "./presentation.ts";

/** UI-only. Never sent to D8N; expands to every gender code in the catalogue. */
export const EVERYONE_UI_CODE = "everyone";

const INTERESTED_LABELS: Record<string, string> = {
  woman: "Women",
  man: "Men",
};

export function interestedInGenderCodes(serverOptions: FieldOption[]): string[] {
  return interestedInChoices(serverOptions).map((option) => option.code);
}

export function interestedInDisplayOptions(serverOptions: FieldOption[]): FieldOption[] {
  const labelled = interestedInChoices(serverOptions).map((option) => ({
    ...option,
    label: INTERESTED_LABELS[option.code] ?? option.label,
  }));
  if (labelled.length < 2) {
    return labelled;
  }
  return [{ code: EVERYONE_UI_CODE, label: "Everyone" }, ...labelled];
}

export function isEveryoneSelection(values: string[], genderCodes: string[]): boolean {
  return genderCodes.length > 1 && genderCodes.every((code) => values.includes(code));
}

export function interestedChipSelected(
  values: string[],
  code: string,
  genderCodes: string[],
): boolean {
  const everyone = isEveryoneSelection(values, genderCodes);
  if (code === EVERYONE_UI_CODE) {
    return everyone;
  }
  if (everyone) {
    return false;
  }
  return values.includes(code);
}

export function toggleInterestedIn(
  values: string[],
  code: string,
  genderCodes: string[],
): string[] {
  if (code === EVERYONE_UI_CODE) {
    return isEveryoneSelection(values, genderCodes) ? [] : [...genderCodes];
  }
  if (isEveryoneSelection(values, genderCodes)) {
    return [code];
  }
  if (values.includes(code)) {
    return values.filter((item) => item !== code);
  }
  return [...values, code];
}
