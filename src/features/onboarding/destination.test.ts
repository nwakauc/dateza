import { describe, expect, it } from "vitest";
import {
  memberDestination,
  optionsScreenForGroup,
  optionsScreenForMissing,
  profileScreenForMissing,
} from "./destination.ts";
import type { ProfileOnboardingStatus } from "../../lib/api/profileTypes.ts";

function status(
  overrides: Partial<ProfileOnboardingStatus> = {},
): ProfileOnboardingStatus {
  return {
    state: "profile_required",
    next_step: "profile",
    profile_exists: false,
    profile_complete: false,
    profile_published: false,
    completion: { complete: false, percent: 0, missing: ["display_name"] },
    ...overrides,
  };
}

describe("onboarding destination", () => {
  it("sends incomplete members to onboarding", () => {
    expect(memberDestination(status())).toBe("/onboarding");
    expect(
      memberDestination(status({ state: "ready_to_publish", next_step: "publication" })),
    ).toBe("/onboarding");
  });

  it("sends a completed member straight to Discover", () => {
    expect(
      memberDestination(
        status({
          state: "complete",
          next_step: null,
          profile_complete: true,
          profile_published: true,
        }),
      ),
    ).toBe("/discover");
  });

  it("keeps a suspended member out of onboarding and Find", () => {
    expect(
      memberDestination(status({ state: "profile_suspended", next_step: null })),
    ).toBe("/home");
  });

  it("uses missing keys from the server to choose the profile screen", () => {
    expect(profileScreenForMissing(["display_name", "bio"])).toBe("basics");
    expect(profileScreenForMissing(["city", "bio"])).toBe("where");
    expect(profileScreenForMissing(["location", "bio"])).toBe("location");
    expect(profileScreenForMissing(["bio"])).toBe("about");
    expect(profileScreenForMissing(["smoking"])).toBe("lifestyle");
    expect(profileScreenForMissing([])).toBe("lifestyle");
  });

  it("groups DateZA's known option-group keys into short, coherent screens", () => {
    expect(optionsScreenForGroup("relationship_intent")).toBe("intent");
    expect(optionsScreenForGroup("has_children")).toBe("family");
    expect(optionsScreenForGroup("wants_children")).toBe("family");
    expect(optionsScreenForGroup("religion_importance")).toBe("more");
    expect(optionsScreenForGroup("social_style")).toBe("more");
    expect(optionsScreenForGroup("meeting_pace")).toBe("more");
  });

  it("falls back unrecognised option-group keys to the last screen instead of dropping them", () => {
    expect(optionsScreenForGroup("some_future_group")).toBe("more");
  });

  it("recognises option-group keys the server namespaces as 'options.<key>' in completion.missing", () => {
    // Regression: completion.missing lists option groups as "options.relationship_intent",
    // not the bare "relationship_intent" configuration.option_groups[].key uses.
    // Getting this wrong silently sent every member straight to the last options
    // screen, skipping "What are you looking for?" and "Family plans" entirely.
    expect(optionsScreenForGroup("options.relationship_intent")).toBe("intent");
    expect(optionsScreenForGroup("options.has_children")).toBe("family");
    expect(optionsScreenForMissing(["options.relationship_intent", "options.has_children"])).toBe(
      "intent",
    );
    expect(optionsScreenForMissing(["options.has_children", "options.wants_children"])).toBe(
      "family",
    );
    expect(optionsScreenForMissing(["options.meeting_pace"])).toBe("more");
  });
});
