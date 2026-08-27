const STORAGE_PREFIX = "dateza:location-confirmed:";

function key(profileId: string): string {
  return `${STORAGE_PREFIX}${profileId}`;
}

/**
 * Narrow refresh/re-entry fallback until backend T6 (`GET /api/v1/profile/location`).
 *
 * GET /api/v1/profile already exposes `location.configured` and, for Place
 * saves, a `place` label. Use that server signal when present. This flag
 * remains only for payloads that omit `location`, and for GPS-only sessions
 * that still need this device to remember a successful save across refresh.
 *
 * Do not store Place ids, names, or coordinates here. Do not add fields.
 * Retire this store when T6 lands.
 */
export function hasConfirmedLocation(profileId: string): boolean {
  try {
    return window.localStorage.getItem(key(profileId)) === "1";
  } catch {
    return false;
  }
}

export function markLocationConfirmed(profileId: string): void {
  try {
    window.localStorage.setItem(key(profileId), "1");
  } catch {
    // Storage unavailable (private browsing, disabled storage, etc.) — the
    // member is just asked again next visit, which is safe.
  }
}
