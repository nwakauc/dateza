import type { FieldOption } from "../../lib/api/profileTypes.ts";

type ChoiceOption = FieldOption & { hint?: string };

type Props = {
  legend: string;
  name: string;
  options: ChoiceOption[];
  value: string;
  onChange: (code: string) => void;
  disabled: boolean;
  describedBy?: string;
  error?: string;
  hideLegend?: boolean;
  required?: boolean;
  /** Optional answers can be taken back off a profile once chosen. */
  clearable?: boolean;
};

export function SingleChoiceField({
  legend,
  name,
  options,
  value,
  onChange,
  disabled,
  describedBy,
  error,
  hideLegend = false,
  required = false,
  clearable = false,
}: Props) {
  const errorId = `${name}-error`;

  return (
    <fieldset className="onboard-fieldset onboard-fieldset--plain" disabled={disabled}>
      <legend className={hideLegend ? "onboard-sr-only" : undefined}>{legend}</legend>
      <div
        className="onboard-segmented"
        role="radiogroup"
        aria-label={legend}
        aria-describedby={describedBy}
      >
        {options.map((option) => {
          const checked = value === option.code;
          const inputId = `${name}-${option.code}`;
          return (
            <label
              key={option.code}
              className="onboard-segment"
              data-selected={checked ? "true" : "false"}
              htmlFor={inputId}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.code}
                checked={checked}
                required={required && !value}
                onChange={() => onChange(option.code)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {clearable && value ? (
        <button
          type="button"
          className="onboard-clear"
          aria-label={`Clear ${legend}`}
          onClick={() => onChange("")}
        >
          Clear
        </button>
      ) : null}
      {error ? (
        <p className="auth-form__hint" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

type MultiProps = {
  legend: string;
  name: string;
  hint?: string;
  options: FieldOption[];
  values: string[];
  onChange: (codes: string[]) => void;
  disabled: boolean;
  error?: string;
  hideLegend?: boolean;
  isSelected?: (code: string) => boolean;
  onToggle?: (code: string) => void;
};

export function MultiChoiceField({
  legend,
  name,
  hint,
  options,
  values,
  onChange,
  disabled,
  error,
  hideLegend = false,
  isSelected,
  onToggle,
}: MultiProps) {
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;

  function toggle(code: string) {
    if (onToggle) {
      onToggle(code);
      return;
    }
    if (values.includes(code)) {
      onChange(values.filter((item) => item !== code));
      return;
    }
    onChange([...values, code]);
  }

  return (
    <fieldset className="onboard-fieldset onboard-fieldset--plain" disabled={disabled}>
      <legend className={hideLegend ? "onboard-sr-only" : undefined}>{legend}</legend>
      {hint ? (
        <p className="auth-form__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      <div className="onboard-segmented">
        {options.map((option) => {
          const checked = isSelected ? isSelected(option.code) : values.includes(option.code);
          const inputId = `${name}-${option.code}`;
          return (
            <label
              key={option.code}
              className="onboard-segment"
              data-selected={checked ? "true" : "false"}
              htmlFor={inputId}
            >
              <input
                id={inputId}
                type="checkbox"
                name={name}
                value={option.code}
                checked={checked}
                onChange={() => toggle(option.code)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {error ? (
        <p className="auth-form__hint" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
