import type { ProfileCompletion } from "../../lib/api/profileTypes.ts";
import type { DatezaRichness } from "./richProfileGaps.ts";

export type StandOutItem = { key: string; label: string };

export type StandOutProgress = {
  percent: number;
  items: StandOutItem[];
  complete: boolean;
};

function d8nItems(profileCompletion: ProfileCompletion): StandOutItem[] {
  if (profileCompletion.suggestions.length > 0) {
    return profileCompletion.suggestions.slice(0, 4).map((item) => ({ key: item.key, label: item.label }));
  }
  return profileCompletion.missing.slice(0, 4).map((key) => ({
    key,
    label: key.replace(/_/g, " "),
  }));
}

/**
 * Member-facing profile strength. Onboarding/publication 100% is not a
 * finished DateZA profile. D8N percent is used only while it is still
 * below 100. Never show 100% next to “add more photos”.
 */
export function standOutProgress(
  richness: DatezaRichness,
  profileCompletion: ProfileCompletion | null | undefined,
): StandOutProgress {
  const d8nPercent =
    profileCompletion != null ? Math.max(0, Math.min(100, Math.round(profileCompletion.percent))) : null;
  const fromD8n = profileCompletion ? d8nItems(profileCompletion) : [];

  if (d8nPercent != null && d8nPercent < 100) {
    return { percent: d8nPercent, items: fromD8n, complete: false };
  }

  if (richness.filled < richness.total) {
    return { percent: richness.percent, items: richness.items, complete: false };
  }

  if (fromD8n.length > 0) {
    return { percent: Math.min(richness.percent, 99), items: fromD8n, complete: false };
  }

  return { percent: 100, items: [], complete: true };
}
