import { useMemo, useState } from "react";
import type { ConfiguredOptionGroup } from "../../../lib/api/profileTypes.ts";

type Props = {
  group: ConfiguredOptionGroup;
  selected: string[];
  onChange: (codes: string[]) => void;
  disabled?: boolean;
};

export function InterestsPicker({ group, selected, onChange, disabled }: Props) {
  const [query, setQuery] = useState("");
  const max = group.max_selections;
  const selectedSet = new Set(selected);
  const labels = new Map(group.options.map((option) => [option.code, option.label]));

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return group.options;
    return group.options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        option.code.toLowerCase().includes(needle) ||
        (option.category ?? "").toLowerCase().includes(needle),
    );
  }, [group.options, query]);

  const categories = useMemo(() => {
    const chosen = new Set(selected);
    const map = new Map<string, typeof filtered>();
    for (const option of filtered) {
      if (chosen.has(option.code)) continue;
      const key = option.category?.trim() || "More";
      const list = map.get(key) ?? [];
      list.push(option);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered, selected]);

  function toggle(code: string) {
    if (disabled) return;
    if (selectedSet.has(code)) {
      onChange(selected.filter((item) => item !== code));
      return;
    }
    if (selected.length >= max) return;
    onChange([...selected, code]);
  }

  return (
    <div className="edit-interests">
      <p className="edit-profile__lede">
        {selected.length}/{max} selected
      </p>
      {selected.length > 0 ? (
        <div className="edit-interests__selected" aria-label="Selected interests">
          {selected.map((code) => (
            <button
              key={code}
              type="button"
              className="edit-interests__chip edit-interests__chip--on"
              onClick={() => toggle(code)}
              disabled={disabled}
            >
              {labels.get(code) ?? code}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="auth-form__hint">Pick a few things you actually enjoy talking about.</p>
      )}
      <label className="edit-interests__search">
        <span className="onboard-sr-only">Search interests</span>
        <input
          type="search"
          value={query}
          placeholder="Search interests"
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="edit-interests__browse">
        {categories.map(([category, options]) => (
          <div key={category} className="edit-interests__group">
            <p className="edit-interests__cat">{category}</p>
            <div className="edit-interests__chips">
              {options.slice(0, query.trim() ? options.length : 12).map((option) => (
                <button
                  key={option.code}
                  type="button"
                  className="edit-interests__chip"
                  onClick={() => toggle(option.code)}
                  disabled={disabled || selected.length >= max}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
