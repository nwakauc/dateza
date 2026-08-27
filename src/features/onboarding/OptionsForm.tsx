import { type FormEvent } from "react";
import type { ConfiguredOptionGroup } from "../../lib/api/profileTypes.ts";
import { MultiChoiceField, SingleChoiceField } from "./ChoiceFields.tsx";
import { optionGroupChoices } from "./presentation.ts";

type Props = {
  groups: ConfiguredOptionGroup[];
  selections: Record<string, string[]>;
  onToggle: (groupKey: string, code: string, cardinality: "single" | "multiple") => void;
  onSubmit: () => Promise<void>;
  pending: boolean;
  error?: string;
  submitLabel?: string;
};

export function OptionsForm({
  groups,
  selections,
  onToggle,
  onSubmit,
  pending,
  error,
  submitLabel = "Continue",
}: Props) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    await onSubmit();
  }

  return (
    <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
      {error ? (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      ) : null}
      {groups.map((group) => {
        const selected = selections[group.key] ?? [];
        const options = optionGroupChoices(group.key, group.options);
        // A screen with a single question already asks it via the page
        // heading, so repeating it as a fieldset legend is redundant copy.
        const hideLegend = groups.length === 1;
        if (group.cardinality === "single") {
          return (
            <SingleChoiceField
              key={group.key}
              legend={group.label}
              name={group.key}
              options={options}
              value={selected[0] ?? ""}
              onChange={(code) => onToggle(group.key, code, "single")}
              disabled={pending}
              required
              hideLegend={hideLegend}
            />
          );
        }
        return (
          <MultiChoiceField
            key={group.key}
            legend={group.label}
            name={group.key}
            options={options}
            values={selected}
            onChange={() => undefined}
            onToggle={(code) => onToggle(group.key, code, "multiple")}
            disabled={pending}
            hideLegend={hideLegend}
          />
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
