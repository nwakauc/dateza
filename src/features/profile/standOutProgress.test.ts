import { describe, expect, it } from "vitest";
import type { OwnerProfile } from "../../lib/api/profileTypes.ts";
import { datezaRichness } from "./richProfileGaps.ts";
import { standOutProgress } from "./standOutProgress.ts";

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

describe("standOutProgress", () => {
  it("uses D8N percent only while it is still below 100", () => {
    const richness = datezaRichness(owner(), 1);
    const progress = standOutProgress(richness, {
      percent: 72,
      level: "good",
      missing: ["more_photos"],
      suggestions: [{ key: "more_photos", label: "Add more photos" }],
      sections: {},
    });
    expect(progress.percent).toBe(72);
    expect(progress.complete).toBe(false);
    expect(progress.items[0]?.label).toBe("Add more photos");
  });

  it("does not show 100% when onboarding is complete and the public profile is still empty", () => {
    const richness = datezaRichness(
      owner({
        profile_completion: { percent: 100, level: "complete", missing: [], suggestions: [], sections: {} },
      }),
      1,
    );
    const progress = standOutProgress(richness, {
      percent: 100,
      level: "complete",
      missing: [],
      suggestions: [],
      sections: {},
    });
    expect(progress.percent).toBe(0);
    expect(progress.complete).toBe(false);
    expect(progress.items.map((item) => item.key)).toEqual(["more_photos", "bio", "prompts", "interests"]);
  });

  it("never claims 100% while leftover suggestions remain", () => {
    const richness = datezaRichness(
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
    );
    const progress = standOutProgress(richness, {
      percent: 100,
      level: "complete",
      missing: [],
      suggestions: [{ key: "more_photos", label: "Add more photos" }],
      sections: {},
    });
    expect(progress.complete).toBe(false);
    expect(progress.percent).toBeLessThan(100);
    expect(progress.items[0]?.label).toBe("Add more photos");
  });
});
