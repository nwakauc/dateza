import { EMPTY_DISCOVER_FILTERS, parseDiscoverFilters, type DiscoverFilters } from "./discoverFilters.ts";

const FILTERS_KEY = "dateza.discover.filters:v1";
const SCROLL_KEY = "dateza.discover.scroll:v1";

export function loadDiscoverFilters(): DiscoverFilters {
  try {
    const raw = sessionStorage.getItem(FILTERS_KEY);
    if (!raw) return EMPTY_DISCOVER_FILTERS;
    return parseDiscoverFilters(JSON.parse(raw)) ?? EMPTY_DISCOVER_FILTERS;
  } catch {
    return EMPTY_DISCOVER_FILTERS;
  }
}

export function saveDiscoverFilters(filters: DiscoverFilters): void {
  try {
    sessionStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    /* quota / private mode */
  }
}

export function loadDiscoverScroll(): number {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function saveDiscoverScroll(offset: number): void {
  try {
    sessionStorage.setItem(SCROLL_KEY, String(Math.max(0, Math.round(offset))));
  } catch {
    /* quota / private mode */
  }
}
