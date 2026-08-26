import { describe, expect, it } from "vitest";
import type { DiscoveryProfile } from "../../lib/api/discoveryTypes.ts";
import {
  EMPTY_DISCOVER_FILTERS,
  applyDiscoverFilters,
  customFilterCount,
  hasDiscoverFilters,
  parseDiscoverFilters,
  toggleQuickFilter,
} from "./discoverFilters.ts";

function profile(overrides: Partial<DiscoveryProfile> = {}): DiscoveryProfile {
  return {
    id: "p1",
    display_name: "Maya",
    age: 27,
    bio: null,
    gender: null,
    pronouns: null,
    country_code: "ZA",
    city: "Cape Town",
    occupation: null,
    job_title: null,
    school_or_institution: null,
    looking_for_text: null,
    height_cm: null,
    body_type: null,
    languages_spoken: [],
    smoking: "never",
    drinking: "socially",
    fitness: "active",
    photos: [],
    options: { relationship_intent: ["long_term_relationship"], interests: ["hiking"] },
    verified: true,
    online: false,
    active_today: false,
    new_here: false,
    last_active_at: null,
    distance_km: 6,
    compatibility: {
      score: 85,
      confidence: 0.8,
      confidence_level: "high",
      version: "dateza_v1",
      reasons: ["shared_long_term_intent"],
    },
    ...overrides,
  };
}

describe("discoverFilters", () => {
  it("does not invent matches when the daily batch is empty", () => {
    expect(applyDiscoverFilters([], { ...EMPTY_DISCOVER_FILTERS, online: true })).toEqual([]);
  });

  it("filters Online now from the authoritative online field only", () => {
    const online = profile({ id: "on", online: true });
    const offline = profile({ id: "off", online: false, last_active_at: "2026-08-26T04:00:00Z" });
    const result = applyDiscoverFilters([online, offline], { ...EMPTY_DISCOVER_FILTERS, online: true });
    expect(result.map((item) => item.id)).toEqual(["on"]);
  });

  it("filters New here from the authoritative new_here field", () => {
    const newbie = profile({ id: "new", new_here: true });
    const established = profile({ id: "old", new_here: false });
    const result = applyDiscoverFilters([newbie, established], { ...EMPTY_DISCOVER_FILTERS, newHere: true });
    expect(result.map((item) => item.id)).toEqual(["new"]);
  });

  it("Nearby keeps only backend distances and sorts nearest first", () => {
    const far = profile({ id: "far", distance_km: 40 });
    const near = profile({ id: "near", distance_km: 4 });
    const unknown = profile({ id: "unk", distance_km: null });
    const result = applyDiscoverFilters([far, unknown, near], { ...EMPTY_DISCOVER_FILTERS, nearby: true });
    expect(result.map((item) => item.id)).toEqual(["near", "far"]);
  });

  it("applies custom filters without changing backend order unless Nearby is on", () => {
    const first = profile({ id: "a", age: 30, distance_km: 20 });
    const second = profile({ id: "b", age: 22, distance_km: 3 });
    const filtered = applyDiscoverFilters([first, second], { ...EMPTY_DISCOVER_FILTERS, minAge: 18, maxAge: 40 });
    expect(filtered.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("excludes profiles that cannot satisfy a distance cap", () => {
    const withDistance = profile({ id: "d", distance_km: 4 });
    const without = profile({ id: "x", distance_km: null });
    const result = applyDiscoverFilters([withDistance, without], { ...EMPTY_DISCOVER_FILTERS, maxDistanceKm: 10 });
    expect(result.map((item) => item.id)).toEqual(["d"]);
  });

  it("counts custom filters separately from quick facets", () => {
    const filters = toggleQuickFilter({ ...EMPTY_DISCOVER_FILTERS, verifiedOnly: true, minAge: 25 }, "online");
    expect(filters.online).toBe(true);
    expect(customFilterCount(filters)).toBe(2);
    expect(hasDiscoverFilters(filters)).toBe(true);
    expect(hasDiscoverFilters(EMPTY_DISCOVER_FILTERS)).toBe(false);
  });

  it("rejects malformed persisted filter payloads", () => {
    expect(parseDiscoverFilters({ online: true })).toBeNull();
    expect(parseDiscoverFilters({ ...EMPTY_DISCOVER_FILTERS, minAge: "25" })).toEqual({
      ...EMPTY_DISCOVER_FILTERS,
      minAge: null,
    });
  });
});
