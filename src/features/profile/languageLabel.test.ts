import { describe, expect, it } from "vitest";
import { formatLanguageList, languageLabel } from "./languageLabel.ts";

describe("language labels", () => {
  it("shows South African language names instead of ISO codes", () => {
    expect(languageLabel("zu")).toBe("isiZulu");
    expect(languageLabel("xh")).toBe("isiXhosa");
    expect(languageLabel("en")).toBe("English");
    expect(languageLabel("af")).toBe("Afrikaans");
  });

  it("keeps already-human names as written", () => {
    expect(languageLabel("English")).toBe("English");
    expect(languageLabel("isiZulu")).toBe("isiZulu");
  });

  it("lists languages in spoken English", () => {
    expect(formatLanguageList(["en", "zu"])).toBe("English and isiZulu");
    expect(formatLanguageList(["en", "af", "zu"])).toBe("English, Afrikaans, and isiZulu");
  });
});
