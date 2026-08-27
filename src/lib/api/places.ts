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
