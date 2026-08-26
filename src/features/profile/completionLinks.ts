/**
 * Deep-links for backend `profile_completion.suggestions[].key` values.
 * Unknown keys fall through to the general editor rather than exposing the
 * raw key as a destination.
 */
export const COMPLETION_HREF: Record<string, string> = {
  more_photos: "/profile/photos",
  photos: "/profile/photos",
  bio: "/profile/edit#about",
  looking_for: "/profile/edit#looking-for",
  interests: "/profile/edit#interests",
  prompt: "/profile/edit#prompts",
  prompts: "/profile/edit#prompts",
  work_or_education: "/profile/edit#work",
  lifestyle: "/profile/edit#lifestyle",
  relationship_intent: "/profile/edit#intent",
  family_plans: "/profile/edit#family",
  languages: "/profile/edit#languages",
  personality: "/profile/edit#personality",
};

export function hrefForCompletionKey(key: string): string {
  return COMPLETION_HREF[key] ?? "/profile/edit";
}
