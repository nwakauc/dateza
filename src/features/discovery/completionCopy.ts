/**
 * Friendly copy for `ProfileOnboardingStatus.completion.missing` keys (see
 * profileTypes.ts). The percent/missing values are real D8N data — this
 * only supplies presentation text for keys we recognise; anything else
 * falls back to a generic prompt rather than showing a raw field key.
 */
const MISSING_KEY_COPY: Record<string, { label: string; description: string }> = {
  photos: { label: "Add more photos", description: "More photos, more matches" },
  more_photos: { label: "Add more photos", description: "More photos, more matches" },
  bio: { label: "Write your bio", description: "Show your personality" },
  looking_for: { label: "Tell people what you're looking for", description: "Help the right people find you" },
  "options.interests": { label: "Add interests", description: "Help us find better matches" },
  interests: { label: "Add interests", description: "Help us find better matches" },
  "options.relationship_intent": { label: "Share your intent", description: "What are you looking for?" },
  relationship_intent: { label: "Share your intent", description: "What are you looking for?" },
  prompts: { label: "Write a prompt", description: "Give people something to reply to" },
  prompt: { label: "Write a prompt", description: "Give people something to reply to" },
  work_or_education: { label: "Add work or education", description: "A little context goes a long way" },
  lifestyle: { label: "Share your lifestyle", description: "Smoking, drinking, and how you live" },
  family_plans: { label: "Share family plans", description: "Only what you're comfortable with" },
  languages: { label: "Add languages", description: "How you like to talk" },
  personality: { label: "Share how you connect", description: "Social and communication style" },
  location: { label: "Confirm your location", description: "See people near you" },
};

const DEFAULT_COPY = { label: "Complete your profile", description: "Get seen by more people" };

const MAX_ITEMS_SHOWN = 4;

export type CompletionItem = { key: string; label: string; description: string };

export function describeMissing(missing: readonly string[]): CompletionItem[] {
  return missing.slice(0, MAX_ITEMS_SHOWN).map((key) => ({ key, ...(MISSING_KEY_COPY[key] ?? DEFAULT_COPY) }));
}
