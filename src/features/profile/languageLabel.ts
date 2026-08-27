/**
 * Official South African languages, shown with the names people actually use.
 * ISO codes still go to D8N; this is display only.
 */
const SA_LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  af: "Afrikaans",
  zu: "isiZulu",
  xh: "isiXhosa",
  st: "Sesotho",
  nso: "Sepedi",
  tn: "Setswana",
  ts: "Xitsonga",
  ss: "siSwati",
  ve: "Tshivenda",
  nr: "isiNdebele",
};

const ISO_LANGUAGE = /^[A-Za-z]{2,3}(?:-[A-Za-z]{2,8})?$/;

export function languageLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const mapped = SA_LANGUAGE_LABELS[trimmed.toLowerCase()];
  if (mapped) return mapped;
  if (ISO_LANGUAGE.test(trimmed)) {
    try {
      const label = new Intl.DisplayNames(["en-ZA", "en"], { type: "language" }).of(trimmed);
      if (label) return label;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export function formatLanguageList(languages: string[]): string {
  const labels = languages.map(languageLabel).filter(Boolean);
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}
