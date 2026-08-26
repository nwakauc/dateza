import { describe, expect, it } from "vitest";
import type { OwnerProfile } from "../../lib/api/profileTypes.ts";
import { ownerPublicPreview } from "./ownerPublicPreview.ts";

const owner: OwnerProfile = {
  id: "owner-1",
  brand: { slug: "dateza", name: "DateZA" },
  status: "active",
  visibility: "visible",
  first_name: "Private",
  last_name: "Name",
  display_name: "Thando",
  bio: "Public bio",
  birthdate: "1995-01-01",
  gender: "woman",
  country_code: "ZA",
  city: "Cape Town",
  occupation: "Designer",
  job_title: "Product designer",
  school_or_institution: "UCT",
  looking_for_text: "Kindness first",
  company_name: "Secret Co",
  height_cm: 168,
  smoking: "never",
  drinking: "occasionally",
  fitness: "active",
  languages_spoken: ["English"],
  options: {
    interests: ["hiking"],
    has_children: ["no"],
    religion: ["christian"],
    relationship_intent: ["long_term_relationship"],
  },
  prompts: [{ key: "green_flag", prompt: "My biggest green flag is…", answer: "Clear communication.", position: 0 }],
  contact_verified: true,
  publication_completion: null,
  profile_completion: null,
};

describe("ownerPublicPreview", () => {
  it("includes public richness and hides owner-only fields", () => {
    const preview = ownerPublicPreview(owner, [], 31, {
      identity_fields: [],
      profile_fields: [],
      preference_fields: [],
      collections: [],
      prompts: [],
      option_groups: [
        {
          key: "interests",
          label: "Interests",
          cardinality: "multiple",
          max_selections: 10,
          required: false,
          visibility: "public_profile",
          options: [{ code: "hiking", label: "Hiking", category: "outdoors" }],
        },
      ],
    });

    expect(preview.bio).toBe("Public bio");
    expect(preview.looking_for_text).toBe("Kindness first");
    expect(preview.prompts).toHaveLength(1);
    expect(preview.interests).toEqual([{ slug: "hiking", label: "Hiking", category: "outdoors" }]);
    expect(preview.languages_spoken).toEqual(["English"]);
    expect(preview.options.has_children).toBeUndefined();
    expect(preview.options.religion).toBeUndefined();
    expect(JSON.stringify(preview)).not.toContain("Secret Co");
    expect(JSON.stringify(preview)).not.toContain("Private");
  });
});
