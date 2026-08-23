import { describe, expect, it } from "vitest";
import { countryChoices, DATEZA_GENDER_CHOICES } from "./presentation.ts";

describe("onboarding presentation catalogues", () => {
  it("puts South Africa first in the country list", () => {
    expect(countryChoices()[0]?.code).toBe("ZA");
    expect(countryChoices()[0]?.label).toMatch(/south africa/i);
  });

  it("keeps DateZA gender codes the API already stores", () => {
    expect(DATEZA_GENDER_CHOICES.map((option) => option.code)).toEqual(["woman", "man"]);
  });
});
