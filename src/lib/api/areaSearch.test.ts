import { describe, expect, it } from "vitest";
import { resolveAreaSearchQuery } from "./areaSearch.ts";

describe("resolveAreaSearchQuery", () => {
  it("maps a common Khayelitsha misspelling to the recognised name", () => {
    expect(resolveAreaSearchQuery("kayelitsha")).toEqual({
      searchQuery: "Khayelitsha",
      suggestedLabel: "Khayelitsha",
    });
  });

  it("fuzzy-corrects a near miss when no exact alias exists", () => {
    expect(resolveAreaSearchQuery("sandten")).toEqual({
      searchQuery: "Sandton",
      suggestedLabel: "Sandton",
    });
  });

  it("leaves an already-correct query unchanged", () => {
    expect(resolveAreaSearchQuery("Khayelitsha")).toEqual({
      searchQuery: "Khayelitsha",
    });
  });
});
