import { describe, expect, it } from "vitest";
import { isInAppSoundEnabled, setInAppSoundEnabled } from "./inAppSoundPreference.ts";

describe("in-app sound preference", () => {
  it("defaults to on and stores the choice on this device", () => {
    expect(isInAppSoundEnabled()).toBe(true);
    setInAppSoundEnabled(false);
    expect(isInAppSoundEnabled()).toBe(false);
    setInAppSoundEnabled(true);
    expect(isInAppSoundEnabled()).toBe(true);
  });
});
