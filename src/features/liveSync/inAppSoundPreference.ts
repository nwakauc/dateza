const STORAGE_KEY = "dateza:in-app-sounds:v1";

/** Browser-only DateZA preference. Not a D8N notification preference. */
export function isInAppSoundEnabled(): boolean {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "off") return false;
    if (stored === "on") return true;
  } catch {
    return true;
  }
  return true;
}

export function setInAppSoundEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    /* private browsing / quota */
  }
}
