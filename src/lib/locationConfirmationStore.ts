const STORAGE_PREFIX = "dateza:location-confirmed:";

function key(profileId: string): string {
  return `${STORAGE_PREFIX}${profileId}`;
}

/**
 * D8N's `GET /api/v1/profile` does not expose whether ProfileLocation is
 * configured — confirmed against staging 2026-08-25: `completion.percent`
 * and `completion.missing` are both unchanged by a successful
 * `PUT /api/v1/profile/location`. Until D8N exposes that signal, this is
 * the only thing the frontend can know: whether *this device* has already
 * seen a successful save for this profile id. It intentionally defaults to
 * "not confirmed" for any profile it hasn't personally confirmed — the
 * worst case is a member who granted location on another device being
 * asked once more here, never a member being silently skipped.
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
