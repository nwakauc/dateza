import type { FieldOption } from "../../lib/api/profileTypes.ts";

type Props = {
  legend: string;
  name: string;
  options: Array<FieldOption & { hint?: string }>;
  value: string;
  onChange: (code: string) => void;
  disabled: boolean;
  describedBy?: string;
  error?: string;
  layout?: "chips" | "cards" | "segmented";
  compact?: boolean;
  hideLegend?: boolean;
};

const GROUP_CLASS_NAME: Record<"chips" | "cards" | "segmented" | "choices", string> = {
  chips: "onboard-chips",
  cards: "onboard-cards",
  segmented: "onboard-segmented",
  choices: "onboard-choices",
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
  layout = "chips",
  compact = false,
  hideLegend = false,
}: Props) {
  const errorId = `${name}-error`;
  const resolvedLayout = layout !== "chips" ? layout : compact ? "chips" : "choices";

  return (
    <fieldset className="onboard-fieldset onboard-fieldset--plain" disabled={disabled}>
      <legend className={hideLegend ? "onboard-sr-only" : undefined}>{legend}</legend>
      <div
        className={GROUP_CLASS_NAME[resolvedLayout]}
        role="radiogroup"
        aria-describedby={describedBy}
      >
        {options.map((option) => {
          const checked = value === option.code;
          const inputId = `${name}-${option.code}`;
          if (layout === "segmented") {
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
                  required={!value}
                  onChange={() => onChange(option.code)}
                />
                {option.label}
              </label>
            );
          }
          return (
            <label
              key={option.code}
              className={
                layout === "cards" ? "onboard-card" : compact ? "onboard-chip" : "onboard-choice"
              }
              data-selected={checked ? "true" : "false"}
              htmlFor={inputId}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.code}
                checked={checked}
                required={!value}
                onChange={() => onChange(option.code)}
              />
              <span className="onboard-choice__text">
                <span className="onboard-choice__label">{option.label}</span>
                {option.hint ? <span className="onboard-choice__hint">{option.hint}</span> : null}
              </span>
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

type MultiProps = {
  legend: string;
  name: string;
  hint?: string;
  options: FieldOption[];
  values: string[];
  onChange: (codes: string[]) => void;
  disabled: boolean;
  error?: string;
  compact?: boolean;
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
  compact = false,
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
      <div className={compact ? "onboard-chips" : "onboard-choices"}>
        {options.map((option) => {
          const checked = isSelected ? isSelected(option.code) : values.includes(option.code);
          const inputId = `${name}-${option.code}`;
          return (
            <label
              key={option.code}
              className={compact ? "onboard-chip" : "onboard-choice"}
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
