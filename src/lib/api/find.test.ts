import { describe, expect, it } from "vitest";
import { findFiltersFromPreferences, parseCompatibility } from "./find.ts";

describe("parseCompatibility", () => {
  it("keeps the backend version instead of hardcoding dateza_v1", () => {
    expect(
      parseCompatibility({
        score: 81,
        confidence: 0.7,
        confidence_level: "high",
        version: "dateza_v2",
        reasons: ["shared_long_term_intent"],
      }),
    ).toMatchObject({
      score: 81,
      version: "dateza_v2",
      reasons: ["shared_long_term_intent"],
    });
  });

  it("falls back when version is missing, without inventing extra fields", () => {
    expect(parseCompatibility({ score: 50, confidence: 0.4, confidence_level: "medium", reasons: [] })).toMatchObject({
      version: "dateza_v1",
    });
  });
});

describe("findFiltersFromPreferences", () => {
  it("sends only the age, distance, and intent params D8N supports", () => {
    expect(
      findFiltersFromPreferences(
        { min_age: 24, max_age: 36, max_distance_km: 50 },
        "long_term_relationship",
      ),
    ).toEqual({
      min_age: 24,
      max_age: 36,
      max_distance_km: 50,
      relationship_intent: "long_term_relationship",
    });
  });

  it("omits empty preferences instead of inventing defaults", () => {
    expect(findFiltersFromPreferences(null)).toEqual({});
    expect(findFiltersFromPreferences({ min_age: null, max_age: null, max_distance_km: null })).toEqual({});
  });
});
