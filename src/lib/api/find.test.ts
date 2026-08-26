import { describe, expect, it } from "vitest";
import { parseCompatibility } from "./find.ts";

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
    expect(
      parseCompatibility({
        score: 50,
        confidence: 0.4,
        confidence_level: "medium",
        reasons: [],
      }),
    ).toMatchObject({ version: "dateza_v1" });
  });
});
