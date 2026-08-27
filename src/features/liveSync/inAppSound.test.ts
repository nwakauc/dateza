import { afterEach, describe, expect, it, vi } from "vitest";
import { inAppAudioUnlocked, playInAppSound, resetInAppAudioForTests, unlockInAppAudio } from "./inAppSound.ts";
import { setInAppSoundEnabled } from "./inAppSoundPreference.ts";

describe("in-app sound", () => {
  afterEach(() => {
    resetInAppAudioForTests();
    setInAppSoundEnabled(true);
    vi.unstubAllGlobals();
  });

  it("does not throw when AudioContext is missing", async () => {
    vi.stubGlobal("AudioContext", undefined);
    unlockInAppAudio();
    await expect(playInAppSound()).resolves.toBe(false);
  });

  it("does not play when the member turned sounds off", async () => {
    setInAppSoundEnabled(false);
    unlockInAppAudio();
    await expect(playInAppSound()).resolves.toBe(false);
  });

  it("plays after unlock when AudioContext is available", async () => {
    const oscillator = { connect: vi.fn(), start: vi.fn(), stop: vi.fn(), frequency: { setValueAtTime: vi.fn() }, type: "sine" };
    const gain = { connect: vi.fn(), gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } };
    const ctx = {
      state: "running",
      currentTime: 0,
      destination: {},
      resume: vi.fn(async () => undefined),
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gain),
    };
    vi.stubGlobal("AudioContext", vi.fn(function AudioContext() {
      return ctx;
    }));
    expect(inAppAudioUnlocked()).toBe(false);
    unlockInAppAudio();
    await expect(playInAppSound()).resolves.toBe(true);
    expect(ctx.createOscillator).toHaveBeenCalled();
  });

  it("fails silently when resume rejects", async () => {
    const ctx = {
      state: "suspended",
      currentTime: 0,
      destination: {},
      resume: vi.fn(async () => {
        throw new Error("blocked");
      }),
      createOscillator: vi.fn(),
      createGain: vi.fn(),
    };
    vi.stubGlobal("AudioContext", vi.fn(function AudioContext() {
      return ctx;
    }));
    unlockInAppAudio();
    await expect(playInAppSound()).resolves.toBe(false);
  });
});
