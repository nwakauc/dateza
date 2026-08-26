import type { FieldOption } from "../../../lib/api/profileTypes.ts";

type Props = {
  options: FieldOption[];
  values: string[];
  onChange: (codes: string[]) => void;
  max?: number;
  disabled?: boolean;
};

export function LanguagesEditor({ options, values, onChange, max = 8, disabled }: Props) {
  const labels = new Map(options.map((option) => [option.code, option.label]));
  const unused = options.filter((option) => !values.includes(option.code));

  function remove(code: string) {
    onChange(values.filter((item) => item !== code));
  }

  function add(code: string) {
    if (!code || values.includes(code) || values.length >= max) return;
    onChange([...values, code]);
  }

  return (
    <div className="edit-languages">
      {values.length === 0 ? (
        <p className="auth-form__hint">Add the languages you’re happy to date in.</p>
      ) : (
        <ul className="edit-languages__list">
          {values.map((code, index) => (
            <li key={code} className="edit-languages__row">
              <span className="edit-languages__name">{labels.get(code) ?? code}</span>
              {index === 0 ? <span className="edit-languages__tag">Listed first</span> : null}
              <button type="button" className="edit-languages__remove" onClick={() => remove(code)} disabled={disabled}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      {unused.length > 0 && values.length < max ? (
        <label className="auth-field">
          <span>Add a language</span>
          <select value="" disabled={disabled} onChange={(event) => add(event.target.value)}>
            <option value="">Choose…</option>
            {unused.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p className="auth-form__hint">
        {values.length}/{max} languages. Proficiency and a primary-language flag aren’t available yet — order is how they
        appear on your profile.
      </p>
    </div>
  );
}
