import { EMPTY_DISCOVER_FILTERS, parseDiscoverFilters, type DiscoverFilters } from "./discoverFilters.ts";

const FILTERS_PREFIX = "dateza.discover.filters:v1";
const SCROLL_PREFIX = "dateza.discover.scroll:v1";

function filtersKey(accountId: string): string {
  return `${FILTERS_PREFIX}:${accountId}`;
}

function scrollKey(accountId: string): string {
  return `${SCROLL_PREFIX}:${accountId}`;
}

export function loadDiscoverFilters(accountId: string | undefined): DiscoverFilters {
  if (!accountId) return EMPTY_DISCOVER_FILTERS;
  try {
    const raw = sessionStorage.getItem(filtersKey(accountId));
    if (!raw) return EMPTY_DISCOVER_FILTERS;
    return parseDiscoverFilters(JSON.parse(raw)) ?? EMPTY_DISCOVER_FILTERS;
  } catch {
    return EMPTY_DISCOVER_FILTERS;
  }
}

export function saveDiscoverFilters(accountId: string | undefined, filters: DiscoverFilters): void {
  if (!accountId) return;
  try {
    sessionStorage.setItem(filtersKey(accountId), JSON.stringify(filters));
  } catch {
    /* quota / private mode */
  }
}

export function loadDiscoverScroll(accountId: string | undefined): number {
  if (!accountId) return 0;
  try {
    const raw = sessionStorage.getItem(scrollKey(accountId));
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function saveDiscoverScroll(accountId: string | undefined, offset: number): void {
  if (!accountId) return;
  try {
    sessionStorage.setItem(scrollKey(accountId), String(Math.max(0, Math.round(offset))));
  } catch {
    /* quota / private mode */
  }
}

/** Drop every Discover filter/scroll key so a later account cannot inherit them. */
export function clearDiscoverFilterMemory(): void {
  try {
    const keys: string[] = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key && (key.startsWith("dateza.discover.filters:") || key.startsWith("dateza.discover.scroll:"))) {
        keys.push(key);
      }
    }
    for (const key of keys) sessionStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}
