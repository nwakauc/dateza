import { isInAppSoundEnabled } from "./inAppSoundPreference.ts";

type AudioContextCtor = typeof AudioContext;

let audioContext: AudioContext | null = null;
let unlocked = false;

function audioContextClass(): AudioContextCtor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
}

function context(): AudioContext | null {
  if (audioContext) return audioContext;
  const Ctor = audioContextClass();
  if (!Ctor) return null;
  try {
    audioContext = new Ctor();
    return audioContext;
  } catch {
    return null;
  }
}

/** Call after a user gesture so later chimes can play. */
export function unlockInAppAudio(): void {
  if (unlocked) return;
  unlocked = true;
  const current = context();
  if (!current) return;
  void current.resume().catch(() => undefined);
}

export function inAppAudioUnlocked(): boolean {
  return unlocked;
}

/**
 * Quiet two-note DateZA chime. Fails silently when autoplay is blocked,
 * AudioContext is missing, or the member turned sounds off.
 */
export async function playInAppSound(): Promise<boolean> {
  if (!isInAppSoundEnabled()) return false;
  const current = context();
  if (!current || !unlocked) return false;
  try {
    if (current.state === "suspended") await current.resume();
    const now = current.currentTime;
    chime(current, now, 523.25, 0.12);
    chime(current, now + 0.11, 659.25, 0.16);
    return true;
  } catch {
    return false;
  }
}

function chime(current: AudioContext, at: number, frequency: number, duration: number) {
  const oscillator = current.createOscillator();
  const gain = current.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.045, at + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(gain);
  gain.connect(current.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.02);
}

export function resetInAppAudioForTests(): void {
  unlocked = false;
  audioContext = null;
}
