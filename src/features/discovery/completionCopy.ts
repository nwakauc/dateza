/**
 * Friendly copy for `ProfileOnboardingStatus.completion.missing` keys (see
 * profileTypes.ts). The percent/missing values are real D8N data — this
 * only supplies presentation text for keys we recognise; anything else
 * falls back to a generic prompt rather than showing a raw field key.
 */
const MISSING_KEY_COPY: Record<string, { label: string; description: string }> = {
  photos: { label: "Add more photos", description: "More photos, more matches" },
  bio: { label: "Write your bio", description: "Show your personality" },
  "options.interests": { label: "Add interests", description: "Help us find better matches" },
  "options.relationship_intent": { label: "Share your intent", description: "What are you looking for?" },
  prompts: { label: "Write a prompt", description: "Give people something to reply to" },
  location: { label: "Confirm your location", description: "See people near you" },
};

const DEFAULT_COPY = { label: "Complete your profile", description: "Get seen by more people" };

const MAX_ITEMS_SHOWN = 4;

export type CompletionItem = { key: string; label: string; description: string };

export function describeMissing(missing: readonly string[]): CompletionItem[] {
  return missing.slice(0, MAX_ITEMS_SHOWN).map((key) => ({ key, ...(MISSING_KEY_COPY[key] ?? DEFAULT_COPY) }));
}
