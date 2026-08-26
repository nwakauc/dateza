import { describe, expect, it } from "vitest";
import type { ProfileDetail } from "../../lib/api/findTypes.ts";
import type { OwnerProfile } from "../../lib/api/profileTypes.ts";
import { forOwnerPreview, ownerPublicPreview } from "./ownerPublicPreview.ts";

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
      openers: [],
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
    expect(preview.distance_km).toBeNull();
    expect(preview.compatibility).toBeNull();
  });

  it("strips viewer-relative and owner-only fields from a public-shaped profile", () => {
    const leaked: ProfileDetail = {
      id: "owner-1",
      display_name: "Thando",
      age: 31,
      bio: "Public bio",
      gender: "woman",
      pronouns: null,
      country_code: "ZA",
      city: "Cape Town",
      occupation: "Designer",
      job_title: "Product designer",
      school_or_institution: "UCT",
      looking_for_text: "Kindness first",
      height_cm: 168,
      body_type: null,
      languages_spoken: ["English"],
      smoking: "never",
      drinking: "occasionally",
      fitness: "active",
      photos: [],
      options: {
        interests: ["hiking"],
        has_children: ["no"],
        religion: ["christian"],
        relationship_intent: ["long_term_relationship"],
      },
      verified: true,
      online: true,
      active_today: true,
      new_here: true,
      last_active_at: "2026-08-26T08:00:00Z",
      distance_km: 6,
      hook_tonight_active: false,
      hook_state: "unavailable",
      prompts: [],
      interests: [{ slug: "hiking", label: "Hiking", category: "outdoors" }],
      compatibility: {
        score: 85,
        confidence: 0.9,
        confidence_level: "high",
        version: "dateza_v1",
        reasons: ["shared_long_term_intent"],
      },
    };

    const preview = forOwnerPreview(leaked);
    expect(preview.options.has_children).toBeUndefined();
    expect(preview.options.religion).toBeUndefined();
    expect(preview.options.relationship_intent).toEqual(["long_term_relationship"]);
    expect(preview.distance_km).toBeNull();
    expect(preview.compatibility).toBeNull();
    expect(preview.online).toBe(false);
    expect(preview.active_today).toBe(false);
    expect(preview.new_here).toBe(false);
    expect(preview.last_active_at).toBeNull();
    expect(JSON.stringify(preview)).not.toContain("Secret Co");
  });
});
