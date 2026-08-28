function compactKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Common South African area spellings and frequent misspellings for suburb
 * search. Keys are compact (letters only, lower case); values are the query
 * sent to the geocoder.
 */
const AREA_SEARCH_ALIASES: Record<string, string> = {
  capetown: "Cape Town",
  eastlondon: "East London",
  seapoint: "Sea Point",
  somersetwest: "Somerset West",
  pietermaritzburg: "Pietermaritzburg",
  kayelitsha: "Khayelitsha",
  kayalitsha: "Khayelitsha",
  khayalitsha: "Khayelitsha",
  khyelitsha: "Khayelitsha",
  soweto: "Soweto",
  sandten: "Sandton",
  midrand: "Midrand",
  parklands: "Parklands",
  bellville: "Bellville",
  stellenbosch: "Stellenbosch",
  george: "George",
  polokwane: "Polokwane",
  pretoria: "Pretoria",
  tshwane: "Pretoria",
  joburg: "Johannesburg",
  jozi: "Johannesburg",
  durban: "Durban",
  dbn: "Durban",
  umhlanga: "Umhlanga",
  ballito: "Ballito",
  rustenburg: "Rustenburg",
  bloemfontein: "Bloemfontein",
  mthatha: "Mthatha",
  grahamstown: "Makhanda",
  makhanda: "Makhanda",
  portelizabeth: "Gqeberha",
  gqberha: "Gqeberha",
  gqeberha: "Gqeberha",
};

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previous = new Array<number>(b.length + 1);
  const current = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) {
    previous[j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1]! + 1,
        previous[j]! + 1,
        previous[j - 1]! + substitutionCost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j]!;
    }
  }

  return previous[b.length]!;
}

function fuzzyAreaCorrection(query: string): string | undefined {
  const key = compactKey(query);
  if (key.length < 4) return undefined;

  const maxDistance = key.length <= 6 ? 1 : 2;
  let best: { term: string; distance: number } | undefined;

  const candidates = new Set<string>();
  for (const [aliasKey, canonical] of Object.entries(AREA_SEARCH_ALIASES)) {
    candidates.add(aliasKey);
    candidates.add(compactKey(canonical));
  }

  for (const candidate of candidates) {
    const distance = levenshtein(key, candidate);
    if (distance > maxDistance || distance === 0) continue;
    const canonical = AREA_SEARCH_ALIASES[candidate] ?? canonicalFromCompact(candidate);
    if (!canonical) continue;
    if (!best || distance < best.distance) {
      best = { term: canonical, distance };
    }
  }

  return best?.term;
}

function canonicalFromCompact(candidate: string): string | undefined {
  for (const [aliasKey, canonical] of Object.entries(AREA_SEARCH_ALIASES)) {
    if (aliasKey === candidate || compactKey(canonical) === candidate) {
      return canonical;
    }
  }
  return undefined;
}

/**
 * Turn a member-typed suburb into the best geocoder query we can. Returns the
 * original query when no safer correction is known.
 */
export function resolveAreaSearchQuery(query: string): { searchQuery: string; suggestedLabel?: string } {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { searchQuery: trimmed };
  }

  const alias = AREA_SEARCH_ALIASES[compactKey(trimmed)];
  if (alias && compactKey(alias) !== compactKey(trimmed)) {
    return { searchQuery: alias, suggestedLabel: alias };
  }

  const fuzzy = fuzzyAreaCorrection(trimmed);
  if (fuzzy && compactKey(fuzzy) !== compactKey(trimmed)) {
    return { searchQuery: fuzzy, suggestedLabel: fuzzy };
  }

  return { searchQuery: trimmed };
}
