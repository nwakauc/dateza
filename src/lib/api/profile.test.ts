import { describe, expect, it, vi } from "vitest";
import { getCurrentProfile, updateProfileLocation } from "./profile.ts";

/**
 * Fixtures below are the real response bodies captured against DateZA
 * staging (dateza-staging-api.d8n.tech) on 2026-08-25 while reproducing the
 * new-member onboarding regression: register → PATCH profile → upload two
 * photos → refresh. Not idealized — these are what the server actually
 * sends, including fields the frontend doesn't surface (`location`,
 * `prompts`, `completion`, `languages` on the profile object itself).
 */

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const realProfileAfterTwoPhotos = {
  profile: {
    id: "874c36b9-b7c5-48bd-8671-5f061c4bd895",
    brand: { slug: "dateza", name: "DateZA" },
    status: "draft",
    visibility: "hidden",
    location: { configured: false },
    options: {},
    prompts: [],
    completion: {
      complete: false,
      percent: 50,
      missing: [
        "preferences.interested_in",
        "preferences.min_age",
        "preferences.max_age",
        "preferences.max_distance_km",
        "location",
        "options.relationship_intent",
        "options.has_children",
        "options.wants_children",
        "options.religion_importance",
        "options.social_style",
        "options.meeting_pace",
      ],
      sections: {
        photos: { complete: true },
        bio: { complete: true },
        basics: { complete: true },
        intent: { complete: false },
        lifestyle: { complete: true },
        interests: { complete: false },
        prompts: { complete: false },
        verification: { complete: false },
      },
    },
    display_name: "QA Tester",
    birthdate: "1995-05-05",
    gender: "woman",
    country_code: "ZA",
    city: "Cape Town",
    bio: "Testing the onboarding flow.",
    smoking: "never",
    drinking: "never",
    occupation: null,
    job_title: null,
    height_cm: null,
    languages: [],
    fitness: null,
    first_name: "QA",
    last_name: "Tester",
  },
  onboarding: {
    state: "profile_incomplete",
    next_step: "preferences",
    profile_exists: true,
    profile_complete: false,
    profile_published: false,
    completion: {
      complete: false,
      percent: 50,
      missing: [
        "preferences.interested_in",
        "preferences.min_age",
        "preferences.max_age",
        "preferences.max_distance_km",
        "location",
        "options.relationship_intent",
        "options.has_children",
        "options.wants_children",
        "options.religion_importance",
        "options.social_style",
        "options.meeting_pace",
      ],
    },
  },
};

const realProfileBeforeAnyOnboarding = {
  profile: null,
  onboarding: {
    state: "profile_required",
    next_step: "profile",
    profile_exists: false,
    profile_complete: false,
    profile_published: false,
    completion: {
      complete: false,
      percent: 0,
      missing: [
        "first_name",
        "last_name",
        "display_name",
        "birthdate",
        "gender",
        "country_code",
        "city",
        "bio",
        "smoking",
        "drinking",
        "preferences.interested_in",
        "preferences.min_age",
        "preferences.max_age",
        "preferences.max_distance_km",
        "photos",
        "location",
        "options.relationship_intent",
        "options.has_children",
        "options.wants_children",
        "options.religion_importance",
        "options.social_style",
        "options.meeting_pace",
      ],
    },
  },
};

const realLocationUpdateResponse = {
  location: {
    configured: true,
    accuracy_meters: 25,
    source: "device",
    captured_at: "2026-08-25T14:40:00Z",
  },
};

describe("getCurrentProfile against real staging response shapes", () => {
  it("parses a fresh account's null-profile response without throwing", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, realProfileBeforeAnyOnboarding));

    const result = await getCurrentProfile();

    expect(result.profile).toBeNull();
    expect(result.onboarding.state).toBe("profile_required");
    expect(result.onboarding.completion.missing).toContain("photos");
  });

  it("parses a profile with two uploaded photos, an unconfigured location, and unrecognised extra fields", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, realProfileAfterTwoPhotos));

    const result = await getCurrentProfile();

    expect(result.profile?.id).toBe("874c36b9-b7c5-48bd-8671-5f061c4bd895");
    expect(result.profile?.display_name).toBe("QA Tester");
    expect(result.onboarding.completion.missing).not.toContain("photos");
    expect(result.onboarding.next_step).toBe("preferences");
  });

  it("does not throw on null lifestyle/occupation fields carried straight through from the server", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, realProfileAfterTwoPhotos));

    const result = await getCurrentProfile();

    expect(result.profile?.occupation).toBeNull();
    expect(result.profile?.height_cm).toBeNull();
    expect(result.profile?.fitness).toBeNull();
    expect(result.profile?.languages_spoken).toEqual([]);
    expect(result.profile?.profile_completion).toBeNull();
  });
});

describe("owner profile_completion parsing", () => {
  it("reads richness from the backend and does not invent a percent", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, {
        profile: {
          ...realProfileAfterTwoPhotos.profile,
          profile_completion: {
            percent: 72,
            level: "good",
            missing: ["more_photos"],
            suggestions: [{ key: "more_photos", label: "Add more photos" }],
            sections: { photos: { percent: 67, complete: false } },
          },
        },
        onboarding: realProfileAfterTwoPhotos.onboarding,
      }),
    );

    const result = await getCurrentProfile();
    expect(result.profile?.profile_completion).toEqual({
      percent: 72,
      level: "good",
      missing: ["more_photos"],
      suggestions: [{ key: "more_photos", label: "Add more photos" }],
      sections: { photos: { percent: 67, complete: false } },
    });
  });
});

describe("updateProfileLocation against the real staging response shape", () => {
  it("parses the current location contract (no echoed coordinates, only accuracy/source/captured_at)", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, realLocationUpdateResponse));

    const result = await updateProfileLocation({
      latitude: -33.9249,
      longitude: 18.4241,
      accuracy_meters: 25,
      captured_at: "2026-08-25T14:40:00Z",
    });

    expect(result).toEqual({
      configured: true,
      accuracy_meters: 25,
      source: "device",
      captured_at: "2026-08-25T14:40:00Z",
    });
  });
});
