import { describe, expect, it } from "vitest";
import { eligibleBirthYears, isoFromParts, parseIsoDate } from "./birthdate.ts";

describe("birthdate helpers", () => {
  it("parses and rebuilds a valid ISO date", () => {
    expect(parseIsoDate("1994-05-01")).toEqual({ year: "1994", month: "5", day: "1" });
    expect(isoFromParts({ year: "1994", month: "5", day: "1" })).toBe("1994-05-01");
  });

  it("rejects impossible calendar dates", () => {
    expect(isoFromParts({ year: "2020", month: "2", day: "31" })).toBeUndefined();
  });

  it("lists years that meet the 18+ rule", () => {
    const years = eligibleBirthYears(new Date("2026-08-22T00:00:00Z"));
    expect(years[0]).toBe(2008);
    expect(years[years.length - 1]).toBe(1906);
  });
});
