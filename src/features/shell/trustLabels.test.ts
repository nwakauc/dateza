import { describe, expect, it } from "vitest";
import { VERIFIED_CONTACT_LABEL } from "./trustLabels.ts";

/**
 * FE-03: the `verified` field is contact/email/phone verification only —
 * never RealMe identity/selfie verification, which does not exist yet.
 * Pins the single canonical label every surface should import.
 */
describe("VERIFIED_CONTACT_LABEL", () => {
  it("is the canonical 'Verified contact' copy", () => {
    expect(VERIFIED_CONTACT_LABEL).toBe("Verified contact");
  });

  it("never reads as RealMe", () => {
    expect(VERIFIED_CONTACT_LABEL.toLowerCase()).not.toContain("realme");
  });
});
