import type { DatezaCompatibilityReason } from "../../lib/api/findTypes.ts";

/**
 * Human-facing copy for the documented D8N compatibility reason codes (see
 * findTypes.ts `DatezaCompatibilityReason` — the verified contract). Only
 * covers values the contract actually defines; never invent new reasons.
 */
const REASON_COPY: Record<DatezaCompatibilityReason, string> = {
  shared_long_term_intent: "Both want something long-term",
  compatible_relationship_goals: "Compatible relationship goals",
  relationship_goal_mismatch: "Different relationship goals",
  compatible_family_plans: "Aligned on family plans",
  family_plan_mismatch: "Different family plans",
  shared_no_smoking: "Both non-smokers",
  smoking_lifestyle_mismatch: "Different smoking habits",
  compatible_drinking_style: "Compatible drinking habits",
  similar_faith_importance: "Similar views on faith",
  similar_social_style: "Similar social style",
  compatible_meeting_pace: "Same pace for meeting up",
  shared_interests: "Shared interests",
  shared_languages: "Shared languages",
  compatible_communication_style: "Compatible communication styles",
  compatible_planning_style: "Compatible planning styles",
  similar_travel_style: "Similar travel style",
  compatible_diet: "Compatible diets",
};

export function describeCompatibilityReasons(reasons: readonly DatezaCompatibilityReason[]): string[] {
  return reasons.map((reason) => REASON_COPY[reason]);
}
