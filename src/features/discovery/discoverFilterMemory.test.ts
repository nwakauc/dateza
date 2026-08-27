import { describe, expect, it } from "vitest";
import { EMPTY_DISCOVER_FILTERS } from "./discoverFilters.ts";
import {
  clearDiscoverFilterMemory,
  loadDiscoverFilters,
  saveDiscoverFilters,
} from "./discoverFilterMemory.ts";

describe("discover filter memory", () => {
  it("keeps one account's filters from leaking into another", () => {
    saveDiscoverFilters("42", { ...EMPTY_DISCOVER_FILTERS, minAge: 28, nearby: true });
    expect(loadDiscoverFilters("99")).toEqual(EMPTY_DISCOVER_FILTERS);
    expect(loadDiscoverFilters("42").minAge).toBe(28);
    expect(loadDiscoverFilters("42").nearby).toBe(true);
    expect(loadDiscoverFilters(undefined)).toEqual(EMPTY_DISCOVER_FILTERS);
  });

  it("clears every namespaced key so a later login starts clean", () => {
    saveDiscoverFilters("42", { ...EMPTY_DISCOVER_FILTERS, verifiedOnly: true });
    saveDiscoverFilters("99", { ...EMPTY_DISCOVER_FILTERS, online: true });
    clearDiscoverFilterMemory();
    expect(loadDiscoverFilters("42")).toEqual(EMPTY_DISCOVER_FILTERS);
    expect(loadDiscoverFilters("99")).toEqual(EMPTY_DISCOVER_FILTERS);
  });
});
