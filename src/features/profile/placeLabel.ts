const CITY_ALIASES: Record<string, string> = {
  capetown: "Cape Town",
  eastlondon: "East London",
  seapoint: "Sea Point",
  somersetwest: "Somerset West",
  pietermaritzburg: "Pietermaritzburg",
};

function compactKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

/** Present a member-entered city as a place people recognise. */
export function formatCityName(city: string | null | undefined): string | undefined {
  const trimmed = city?.trim();
  if (!trimmed) return undefined;
  const alias = CITY_ALIASES[compactKey(trimmed)];
  if (alias) return alias;
  const spaced = trimmed.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0)!.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatCountryName(countryCode: string | null | undefined): string | undefined {
  const code = countryCode?.trim().toUpperCase();
  if (!code) return undefined;
  if (code === "ZA") return "South Africa";
  try {
    return new Intl.DisplayNames(["en-ZA", "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * DateZA is South African: a city is enough. Never append a country code
 * like ZA next to Cape Town. Country name is only used when city is missing.
 */
export function formatPlace(city: string | null | undefined, countryCode: string | null | undefined): string | undefined {
  return formatCityName(city) ?? formatCountryName(countryCode);
}

export function formatPlaceWithDistance(
  city: string | null | undefined,
  countryCode: string | null | undefined,
  distanceKm: number | null | undefined,
): string | undefined {
  const place = formatPlace(city, countryCode);
  const distance = distanceKm != null && Number.isFinite(distanceKm) ? `${Math.round(distanceKm)} km away` : undefined;
  if (place && distance) return `${place} · ${distance}`;
  return place ?? distance;
}
