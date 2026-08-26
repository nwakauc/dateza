import { describe, expect, it } from "vitest";
import type { OwnerProfile } from "../../lib/api/profileTypes.ts";
import { datezaRichness, isDatezaProfileRich } from "./richProfileGaps.ts";

function owner(overrides: Partial<OwnerProfile> = {}): OwnerProfile {
  return {
    id: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    brand: { slug: "dateza", name: "DateZA" },
    status: "active",
    visibility: "visible",
    first_name: "Ne",
    last_name: "Cub",
    display_name: "Necub",
    bio: null,
    birthdate: "1994-01-01",
    gender: "male",
    country_code: "ZA",
    city: "Cape Town",
    occupation: null,
    job_title: null,
    school_or_institution: null,
    looking_for_text: null,
    company_name: null,
    height_cm: null,
    smoking: null,
    drinking: null,
    fitness: null,
    languages_spoken: [],
    options: {},
    prompts: [],
    contact_verified: true,
    publication_completion: { complete: true, percent: 100, missing: [] },
    profile_completion: null,
    ...overrides,
  };
}

describe("datezaRichness", () => {
  it("treats a published onboarding profile with no extras as mostly empty", () => {
    const richness = datezaRichness(owner(), 1);
    expect(richness.filled).toBe(0);
    expect(richness.total).toBe(8);
    expect(richness.percent).toBe(0);
    expect(richness.items.map((item) => item.key)).toEqual(["more_photos", "bio", "prompts", "interests"]);
    expect(isDatezaProfileRich(owner(), 1)).toBe(false);
  });

  it("does not treat publication_completion 100% as a finished DateZA profile", () => {
    const richness = datezaRichness(owner({ profile_completion: { percent: 100, level: "complete", missing: [], suggestions: [], sections: {} } }), 1);
    expect(richness.filled).toBe(0);
    expect(isDatezaProfileRich(owner(), 1)).toBe(false);
  });

  it("counts filled public details without inventing D8N fields", () => {
    const richness = datezaRichness(
      owner({
        bio: "Weekend markets and long walks.",
        looking_for_text: "Something real",
        languages_spoken: ["English"],
        prompts: [{ key: "p1", prompt: "Friday night", answer: "Braai", position: 0 }],
        options: { interests: ["hiking"], relationship_intent: ["long_term"] },
      }),
      3,
    );
    expect(richness.filled).toBe(6);
    expect(richness.items.map((item) => item.key)).toEqual(["work_or_education", "lifestyle"]);
  });

  it("hides the prompt only when every richness slot is filled", () => {
    expect(
      isDatezaProfileRich(
        owner({
          bio: "Hello",
          looking_for_text: "Dates",
          occupation: "Designer",
          smoking: "no",
          languages_spoken: ["English"],
          prompts: [{ key: "p1", prompt: "Q", answer: "A", position: 0 }],
          options: { interests: ["art"] },
        }),
        3,
      ),
    ).toBe(true);
  });
});
