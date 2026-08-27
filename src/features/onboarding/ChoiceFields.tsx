import type { FieldOption } from "../../lib/api/profileTypes.ts";
import { MAX_SEGMENTED_OPTIONS } from "./presentation.ts";

type ChoiceOption = FieldOption & { hint?: string };

/** `auto` uses the Email/Phone holder for 2–3 options and chips for larger sets. */
export type ChoiceLayout = "auto" | "chips" | "segmented";

function controlLayout(optionCount: number, layout: ChoiceLayout): "segmented" | "chips" {
  if (layout === "chips" || layout === "segmented") {
    return layout;
  }
  return optionCount > 0 && optionCount <= MAX_SEGMENTED_OPTIONS ? "segmented" : "chips";
}

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
  layout?: ChoiceLayout;
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
  layout = "auto",
}: Props) {
  const errorId = `${name}-error`;
  const compact = controlLayout(options.length, layout) === "segmented";

  return (
    <fieldset className="onboard-fieldset onboard-fieldset--plain" disabled={disabled}>
      <legend className={hideLegend ? "onboard-sr-only" : undefined}>{legend}</legend>
      <div
        className={compact ? "onboard-segmented" : "onboard-chips"}
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
              className={compact ? "onboard-segment" : "onboard-chip"}
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
  layout?: ChoiceLayout;
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
  layout = "auto",
}: MultiProps) {
  const hintId = `${name}-hint`;
  const errorId = `${name}-error`;
  const compact = controlLayout(options.length, layout) === "segmented";

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
      <div className={compact ? "onboard-segmented" : "onboard-chips"}>
        {options.map((option) => {
          const checked = isSelected ? isSelected(option.code) : values.includes(option.code);
          const inputId = `${name}-${option.code}`;
          return (
            <label
              key={option.code}
              className={compact ? "onboard-segment" : "onboard-chip"}
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
