import type { FieldOption } from "../../../lib/api/profileTypes.ts";

export function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className="edit-profile__count">
      {value.length}/{max}
    </span>
  );
}

type SelectProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FieldOption[];
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
  allowEmpty?: boolean;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder = "Select",
  hint,
  allowEmpty = true,
}: SelectProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.value)}
      >
        {allowEmpty ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      {hint ? (
        <p className="auth-form__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PrivacyNote({ children }: { children: string }) {
  return <p className="edit-profile__privacy">{children}</p>;
}
