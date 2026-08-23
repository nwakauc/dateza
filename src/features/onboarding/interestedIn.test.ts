import { describe, expect, it } from "vitest";
import {
  EVERYONE_UI_CODE,
  interestedChipSelected,
  interestedInDisplayOptions,
  interestedInGenderCodes,
  toggleInterestedIn,
} from "./interestedIn.ts";

const empty: never[] = [];

describe("interested-in presentation", () => {
  const codes = interestedInGenderCodes(empty);

  it("exposes DateZA's gender codes with an Everyone option prepended", () => {
    expect(codes).toEqual(["woman", "man"]);
    expect(interestedInDisplayOptions(empty).map((option) => option.label)).toEqual([
      "Everyone",
      "Women",
      "Men",
    ]);
  });

  it("maps Everyone to every gender code and clears specifics in the UI", () => {
    const selected = toggleInterestedIn([], EVERYONE_UI_CODE, codes);
    expect(selected).toEqual(codes);
    expect(interestedChipSelected(selected, EVERYONE_UI_CODE, codes)).toBe(true);
    expect(interestedChipSelected(selected, "woman", codes)).toBe(false);
  });

  it("replaces Everyone with a single gender", () => {
    const everyone = toggleInterestedIn([], EVERYONE_UI_CODE, codes);
    expect(toggleInterestedIn(everyone, "woman", codes)).toEqual(["woman"]);
  });
});
