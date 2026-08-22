import { useId, useState } from "react";

type Props = {
  id?: string;
  label: string;
  name: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  describedBy?: string;
};

export function PasswordField({
  id,
  label,
  name,
  autoComplete,
  value,
  onChange,
  disabled = false,
  describedBy,
}: Props) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={fieldId}>{label}</label>
      <div className="auth-field__password">
        <input
          id={fieldId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          required
          minLength={6}
          spellCheck={false}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          className="auth-field__toggle"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
