import { describe, expect, it } from "vitest";
import { formatCityName, formatPlace, formatPlaceWithDistance } from "./placeLabel.ts";

describe("place labels", () => {
  it("presents compacted Cape Town names as Cape Town", () => {
    expect(formatCityName("capetown")).toBe("Cape Town");
    expect(formatCityName("CapeTown")).toBe("Cape Town");
    expect(formatCityName("Cape Town")).toBe("Cape Town");
  });

  it("does not append ZA next to a South African city", () => {
    expect(formatPlace("Cape Town", "ZA")).toBe("Cape Town");
    expect(formatPlace("capetown", "za")).toBe("Cape Town");
  });

  it("uses the country name only when the city is missing", () => {
    expect(formatPlace(null, "ZA")).toBe("South Africa");
  });

  it("joins place and distance with a middle dot", () => {
    expect(formatPlaceWithDistance("Cape Town", "ZA", 8)).toBe("Cape Town · 8 km away");
    expect(formatPlaceWithDistance("CapeTown", "ZA", 8.4)).toBe("Cape Town · 8 km away");
  });
});
