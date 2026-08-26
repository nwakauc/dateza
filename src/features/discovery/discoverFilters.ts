import type { DiscoveryProfile } from "../../lib/api/discoveryTypes.ts";

/**
 * Client-side view of the member's existing daily Discover selection.
 * GET /api/v1/discovery has no filter query params — these never call Find
 * and never request a different curated batch from D8N.
 */
export type DiscoverFilters = {
  online: boolean;
  nearby: boolean;
  newHere: boolean;
  minAge: number | null;
  maxAge: number | null;
  maxDistanceKm: number | null;
  relationshipIntents: string[];
  minCompatibility: number | null;
  verifiedOnly: boolean;
  smoking: string[];
  drinking: string[];
  fitness: string[];
  interests: string[];
};

export const EMPTY_DISCOVER_FILTERS: DiscoverFilters = {
  online: false,
  nearby: false,
  newHere: false,
  minAge: null,
  maxAge: null,
  maxDistanceKm: null,
  relationshipIntents: [],
  minCompatibility: null,
  verifiedOnly: false,
  smoking: [],
  drinking: [],
  fitness: [],
  interests: [],
};

const CUSTOM_KEYS = [
  "minAge",
  "maxAge",
  "maxDistanceKm",
  "relationshipIntents",
  "minCompatibility",
  "verifiedOnly",
  "smoking",
  "drinking",
  "fitness",
  "interests",
] as const;

export function hasDiscoverFilters(filters: DiscoverFilters): boolean {
  return (
    filters.online ||
    filters.nearby ||
    filters.newHere ||
    customFilterCount(filters) > 0
  );
}

export function customFilterCount(filters: DiscoverFilters): number {
  let count = 0;
  if (filters.minAge != null) count += 1;
  if (filters.maxAge != null) count += 1;
  if (filters.maxDistanceKm != null) count += 1;
  if (filters.relationshipIntents.length > 0) count += 1;
  if (filters.minCompatibility != null) count += 1;
  if (filters.verifiedOnly) count += 1;
  if (filters.smoking.length > 0) count += 1;
  if (filters.drinking.length > 0) count += 1;
  if (filters.fitness.length > 0) count += 1;
  if (filters.interests.length > 0) count += 1;
  return count;
}

export function toggleQuickFilter(
  filters: DiscoverFilters,
  key: "online" | "nearby" | "newHere",
): DiscoverFilters {
  return { ...filters, [key]: !filters[key] };
}

function codesOverlap(selected: string[], available: string[] | undefined): boolean {
  if (selected.length === 0) return true;
  if (!available || available.length === 0) return false;
  return selected.some((code) => available.includes(code));
}

function matchesLifestyle(selected: string[], value: string | null): boolean {
  if (selected.length === 0) return true;
  return value != null && selected.includes(value);
}

export function profileMatchesDiscoverFilters(profile: DiscoveryProfile, filters: DiscoverFilters): boolean {
  if (filters.online && !profile.online) return false;
  if (filters.newHere && !profile.new_here) return false;
  if (filters.nearby && profile.distance_km == null) return false;
  if (filters.verifiedOnly && !profile.verified) return false;

  if (filters.minAge != null && (profile.age == null || profile.age < filters.minAge)) return false;
  if (filters.maxAge != null && (profile.age == null || profile.age > filters.maxAge)) return false;

  if (filters.maxDistanceKm != null) {
    if (profile.distance_km == null || profile.distance_km > filters.maxDistanceKm) return false;
  }

  if (filters.minCompatibility != null) {
    if (!profile.compatibility || profile.compatibility.score < filters.minCompatibility) return false;
  }

  if (!codesOverlap(filters.relationshipIntents, profile.options.relationship_intent)) return false;
  if (!codesOverlap(filters.interests, profile.options.interests)) return false;
  if (!matchesLifestyle(filters.smoking, profile.smoking)) return false;
  if (!matchesLifestyle(filters.drinking, profile.drinking)) return false;
  if (!matchesLifestyle(filters.fitness, profile.fitness)) return false;

  return true;
}

export function applyDiscoverFilters(
  profiles: readonly DiscoveryProfile[],
  filters: DiscoverFilters,
): DiscoveryProfile[] {
  const matched = profiles.filter((profile) => profileMatchesDiscoverFilters(profile, filters));
  if (!filters.nearby) return matched;
  return [...matched].sort(
    (left, right) => (left.distance_km ?? Number.POSITIVE_INFINITY) - (right.distance_km ?? Number.POSITIVE_INFINITY),
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function asNullableNumber(value: unknown): number | null {
  if (value === null) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseDiscoverFilters(value: unknown): DiscoverFilters | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.online !== "boolean" || typeof record.nearby !== "boolean" || typeof record.newHere !== "boolean") {
    return null;
  }
  if (typeof record.verifiedOnly !== "boolean") return null;
  const relationshipIntents = record.relationshipIntents;
  const smoking = record.smoking;
  const drinking = record.drinking;
  const fitness = record.fitness;
  const interests = record.interests;
  if (!isStringArray(relationshipIntents) || !isStringArray(smoking) || !isStringArray(drinking) || !isStringArray(fitness) || !isStringArray(interests)) {
    return null;
  }
  return {
    online: record.online,
    nearby: record.nearby,
    newHere: record.newHere,
    minAge: asNullableNumber(record.minAge),
    maxAge: asNullableNumber(record.maxAge),
    maxDistanceKm: asNullableNumber(record.maxDistanceKm),
    relationshipIntents,
    minCompatibility: asNullableNumber(record.minCompatibility),
    verifiedOnly: record.verifiedOnly,
    smoking,
    drinking,
    fitness,
    interests,
  };
}

export function isCustomKey(key: string): key is (typeof CUSTOM_KEYS)[number] {
  return (CUSTOM_KEYS as readonly string[]).includes(key);
}
