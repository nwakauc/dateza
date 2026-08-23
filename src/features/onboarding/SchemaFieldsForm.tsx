import { useId, useMemo, useState, type FormEvent } from "react";
import type { ConfiguredField } from "../../lib/api/profileTypes.ts";
import { BirthdateField } from "./BirthdateField.tsx";
import { SingleChoiceField } from "./ChoiceFields.tsx";
import { fieldError } from "./onboardingErrors.ts";
import { countryChoices, genderChoices, lifestyleChoices } from "./presentation.ts";

type Props = {
  fields: ConfiguredField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSubmit: () => Promise<void>;
  pending: boolean;
  error?: string;
  details?: Record<string, string[]>;
  submitLabel: string;
  /** Small supporting copy rendered beneath a specific field, keyed by field key. */
  fieldHints?: Record<string, string>;
};

export function SchemaFieldsForm({
  fields,
  values,
  onChange,
  onSubmit,
  pending,
  error,
  details,
  submitLabel,
  fieldHints,
}: Props) {
  const errorId = useId();
  const countries = useMemo(
    () => (fields.some((field) => field.key === "country_code") ? countryChoices() : []),
    [fields],
  );
  const [localError, setLocalError] = useState<string | undefined>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    const birthdate = fields.find((field) => field.key === "birthdate");
    if (
      birthdate?.required &&
      !/^\d{4}-\d{2}-\d{2}$/.test(values.birthdate ?? "")
    ) {
      setLocalError("Choose a real date of birth.");
      return;
    }
    setLocalError(undefined);
    await onSubmit();
  }

  return (
    <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
      {(error ?? localError) ? (
        <p className="auth-form__error" id={errorId} role="alert">
          {error ?? localError}
        </p>
      ) : null}
      {fields.map((field) => {
        const id = `onboard-${field.key}`;
        const describedBy = fieldError(details, field.key)
          ? `${id}-error`
          : error
            ? errorId
            : undefined;
        if (field.key === "birthdate" || field.input_type === "date") {
          return (
            <BirthdateField
              key={field.key}
              id={id}
              label={field.label}
              value={values[field.key] ?? ""}
              onChange={(iso) => onChange(field.key, iso)}
              disabled={pending}
              required={field.required}
              describedBy={describedBy}
              error={fieldError(details, field.key)}
            />
          );
        }
        if (field.key === "gender") {
          return (
            <SingleChoiceField
              key={field.key}
              legend={field.label}
              name={field.key}
              options={genderChoices(field.options)}
              value={values[field.key] ?? ""}
              onChange={(code) => onChange(field.key, code)}
              disabled={pending}
              describedBy={describedBy}
              compact
              error={fieldError(details, field.key)}
            />
          );
        }
        if (field.key === "smoking" || field.key === "drinking") {
          return (
            <SingleChoiceField
              key={field.key}
              legend={field.label}
              name={field.key}
              options={lifestyleChoices(field.key, field.options)}
              value={values[field.key] ?? ""}
              onChange={(code) => onChange(field.key, code)}
              disabled={pending}
              layout="segmented"
              describedBy={describedBy}
              error={fieldError(details, field.key)}
            />
          );
        }
        if (field.key === "country_code") {
          return (
            <div className="auth-field" key={field.key}>
              <label htmlFor={id}>{field.label}</label>
              <select
                id={id}
                name={field.key}
                autoComplete="country"
                value={values[field.key] ?? ""}
                onChange={(event) => onChange(field.key, event.target.value)}
                disabled={pending}
                required={field.required}
                aria-describedby={describedBy}
              >
                <option value="">Choose a country</option>
                {countries.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              {fieldError(details, field.key) ? (
                <p className="auth-form__hint" id={`${id}-error`} role="alert">
                  {fieldError(details, field.key)}
                </p>
              ) : null}
            </div>
          );
        }
        return (
          <div className="auth-field" key={field.key}>
            <label htmlFor={id}>{field.label}</label>
            {field.input_type === "textarea" ? (
              <textarea
                id={id}
                name={field.key}
                value={values[field.key] ?? ""}
                onChange={(event) => onChange(field.key, event.target.value)}
                disabled={pending}
                required={field.required}
                rows={4}
                aria-describedby={describedBy}
              />
            ) : field.input_type === "select" ? (
              <select
                id={id}
                name={field.key}
                value={values[field.key] ?? ""}
                onChange={(event) => onChange(field.key, event.target.value)}
                disabled={pending}
                required={field.required}
                aria-describedby={describedBy}
              >
                <option value="">Select</option>
                {field.options.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                name={field.key}
                type={field.input_type === "integer" ? "number" : "text"}
                inputMode={field.input_type === "integer" ? "numeric" : undefined}
                autoComplete={
                  field.key === "first_name" || field.key === "display_name"
                    ? "given-name"
                    : field.key === "last_name"
                      ? "family-name"
                      : field.key === "city"
                        ? "address-level2"
                        : "off"
                }
                value={values[field.key] ?? ""}
                onChange={(event) => onChange(field.key, event.target.value)}
                disabled={pending}
                required={field.required}
                aria-describedby={describedBy}
              />
            )}
            {fieldError(details, field.key) ? (
              <p className="auth-form__hint" id={`${id}-error`} role="alert">
                {fieldError(details, field.key)}
              </p>
            ) : fieldHints?.[field.key] ? (
              <p className="auth-form__hint">{fieldHints[field.key]}</p>
            ) : null}
          </div>
        );
      })}
      <div className="onboard-actions">
        <button className="auth-form__submit" type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
