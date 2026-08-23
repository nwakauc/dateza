const MINIMUM_AGE = 18;
const MAXIMUM_AGE = 120;

export type DateParts = {
  day: string;
  month: string;
  year: string;
};

export function emptyDateParts(): DateParts {
  return { day: "", month: "", year: "" };
}

export function parseIsoDate(iso: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return emptyDateParts();
  }
  return { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) };
}

export function isoFromParts(parts: DateParts): string | undefined {
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return undefined;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function eligibleBirthYears(now = new Date()): number[] {
  const latest = now.getUTCFullYear() - MINIMUM_AGE;
  const earliest = now.getUTCFullYear() - MAXIMUM_AGE;
  const years: number[] = [];
  for (let year = latest; year >= earliest; year -= 1) {
    years.push(year);
  }
  return years;
}

export const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;
