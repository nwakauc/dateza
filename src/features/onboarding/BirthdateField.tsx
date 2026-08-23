import { useState } from "react";
import {
  eligibleBirthYears,
  emptyDateParts,
  isoFromParts,
  MONTH_OPTIONS,
  parseIsoDate,
  type DateParts,
} from "./birthdate.ts";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (iso: string) => void;
  disabled: boolean;
  required: boolean;
  describedBy?: string;
  error?: string;
};

export function BirthdateField({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  describedBy,
  error,
}: Props) {
  const [draft, setDraft] = useState<DateParts | undefined>();
  const parts = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseIsoDate(value) : (draft ?? emptyDateParts());
  const years = eligibleBirthYears();

  function handlePart(part: keyof DateParts, nextValue: string) {
    const merged = { ...parts, [part]: nextValue };
    const iso = isoFromParts(merged);
    setDraft(iso ? undefined : merged);
    onChange(iso ?? "");
  }

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const described = [hintId, describedBy, error ? errorId : undefined].filter(Boolean).join(" ");

  return (
    <fieldset className="onboard-fieldset onboard-fieldset--plain" disabled={disabled}>
      <legend>{label}</legend>
      <p className="auth-form__hint" id={hintId}>
        Other members only see your age.
      </p>
      <div className="onboard-date">
        <label
          className="onboard-date__part"
          data-filled={parts.month ? "true" : "false"}
          htmlFor={`${id}-month`}
        >
          <span>Month</span>
          <select
            id={`${id}-month`}
            name="birthdate-month"
            autoComplete="bday-month"
            required={required}
            value={parts.month}
            aria-describedby={described}
            onChange={(event) => handlePart("month", event.target.value)}
          >
            <option value="">Month</option>
            {MONTH_OPTIONS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>
        <label
          className="onboard-date__part"
          data-filled={parts.day ? "true" : "false"}
          htmlFor={`${id}-day`}
        >
          <span>Day</span>
          <select
            id={`${id}-day`}
            name="birthdate-day"
            autoComplete="bday-day"
            required={required}
            value={parts.day}
            onChange={(event) => handlePart("day", event.target.value)}
          >
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, index) => {
              const day = String(index + 1);
              return (
                <option key={day} value={day}>
                  {day}
                </option>
              );
            })}
          </select>
        </label>
        <label
          className="onboard-date__part"
          data-filled={parts.year ? "true" : "false"}
          htmlFor={`${id}-year`}
        >
          <span>Year</span>
          <select
            id={`${id}-year`}
            name="birthdate-year"
            autoComplete="bday-year"
            required={required}
            value={parts.year}
            onChange={(event) => handlePart("year", event.target.value)}
          >
            <option value="">Year</option>
            {years.map((year) => (
              <option key={year} value={String(year)}>
                {year}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p className="auth-form__hint" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
