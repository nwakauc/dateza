import { ApiError } from "./errors.ts";
import { apiRequest } from "./client.ts";
import type { Place } from "./placesTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePlace(value: unknown): Place | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== "number" ||
    !Number.isInteger(value.id) ||
    typeof value.kind !== "string" ||
    typeof value.name !== "string" ||
    typeof value.code !== "string" ||
    typeof value.has_children !== "boolean"
  ) {
    return undefined;
  }
  return {
    id: value.id,
    kind: value.kind,
    name: value.name,
    code: value.code,
    has_children: value.has_children,
  };
}

function placesPath(parentId?: number): string {
  if (parentId === undefined) {
    return "/api/v1/places";
  }
  const params = new URLSearchParams({ parent_id: String(parentId) });
  return `/api/v1/places?${params.toString()}`;
}

/**
 * GET /api/v1/places — top-level regions when `parentId` is omitted,
 * children of that Place otherwise. Country coverage is server-configured;
 * DateZA must not hard-code geography.
 *
 * D8N OpenAPI does not currently expose a dedicated location-search
 * endpoint. DateZA therefore loads this catalogue once and filters it
 * locally. Selection is always `PUT /profile/place`.
 */
export function listPlaces(parentId?: number): Promise<Place[]> {
  return apiRequest(placesPath(parentId)).then((data) => {
    if (!isRecord(data) || !Array.isArray(data.places)) {
      throw new ApiError(502, undefined, "invalid_places_response");
    }
    return data.places.flatMap((item) => {
      const place = parsePlace(item);
      return place ? [place] : [];
    });
  });
}

export type PlaceSearchHit = {
  id: number;
  name: string;
  displayPath: string;
};

export const PLACE_SEARCH_MIN_CHARS = 2;
export const PLACE_SEARCH_LIMIT = 8;
const MAX_PLACE_DEPTH = 4;

let indexPromise: Promise<PlaceSearchHit[]> | undefined;

async function collectHits(
  place: Place,
  ancestors: string[],
  visited: Set<number>,
  depth: number,
): Promise<PlaceSearchHit[]> {
  if (visited.has(place.id) || depth > MAX_PLACE_DEPTH) return [];
  visited.add(place.id);
  const displayPath = [place.name, ...ancestors].join(", ");
  const self: PlaceSearchHit = { id: place.id, name: place.name, displayPath };
  if (!place.has_children) return [self];
  const children = await listPlaces(place.id);
  const nested = await Promise.all(
    children.map((child) => collectHits(child, [place.name, ...ancestors], visited, depth + 1)),
  );
  return [self, ...nested.flat()];
}

/** Flatten the brand Place catalogue for suburb/city/area search. */
export function loadPlaceSearchIndex(): Promise<PlaceSearchHit[]> {
  if (!indexPromise) {
    indexPromise = listPlaces()
      .then(async (roots) => {
        const visited = new Set<number>();
        const groups = await Promise.all(roots.map((root) => collectHits(root, [], visited, 1)));
        return groups.flat();
      })
      .catch((error: unknown) => {
        indexPromise = undefined;
        throw error;
      });
  }
  return indexPromise;
}

export function resetPlaceSearchIndex(): void {
  indexPromise = undefined;
}

export function filterPlaceSearchHits(hits: PlaceSearchHit[], query: string): PlaceSearchHit[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < PLACE_SEARCH_MIN_CHARS) return [];
  const nameHits: PlaceSearchHit[] = [];
  const pathHits: PlaceSearchHit[] = [];
  for (const hit of hits) {
    if (hit.name.toLowerCase().includes(needle)) {
      nameHits.push(hit);
    } else if (hit.displayPath.toLowerCase().includes(needle)) {
      pathHits.push(hit);
    }
    if (nameHits.length >= PLACE_SEARCH_LIMIT) break;
  }
  return [...nameHits, ...pathHits].slice(0, PLACE_SEARCH_LIMIT);
}

/**
 * Search dating areas through D8N Places. There is no dedicated
 * `/locations/search` contract today; this loads the catalogue once and
 * filters it. Selection remains `PUT /profile/place`.
 */
export async function searchPlaces(query: string): Promise<PlaceSearchHit[]> {
  const needle = query.trim();
  if (needle.length < PLACE_SEARCH_MIN_CHARS) return [];
  const hits = await loadPlaceSearchIndex();
  return filterPlaceSearchHits(hits, needle);
}
