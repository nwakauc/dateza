import type { FindProfile } from "../../lib/api/findTypes.ts";

const MAX_AGE_MS = 30 * 60 * 1000;

type DeckMemory = {
  activeId: string;
  savedAt: number;
};

let memory: DeckMemory | undefined;

export function rememberFindActive(profile: FindProfile | undefined): void {
  memory = profile ? { activeId: profile.id, savedAt: Date.now() } : undefined;
}

export function clearFindDeckMemory(): void {
  memory = undefined;
}

export function rememberedFindActiveId(): string | undefined {
  if (!memory) return undefined;
  if (Date.now() - memory.savedAt > MAX_AGE_MS) {
    memory = undefined;
    return undefined;
  }
  return memory.activeId;
}

/** Prefer the profile the member was looking at if it is still in this page of Find. */
export function orderFindProfiles(profiles: FindProfile[], preferredId: string | undefined): FindProfile[] {
  if (!preferredId || profiles.length === 0) return profiles;
  const index = profiles.findIndex((profile) => profile.id === preferredId);
  if (index <= 0) return profiles;
  const preferred = profiles[index];
  return [preferred, ...profiles.slice(0, index), ...profiles.slice(index + 1)];
}
