import { useId, useMemo, useState, type FormEvent } from "react";
import type { ConfiguredField } from "../../lib/api/profileTypes.ts";
import { MultiChoiceField } from "./ChoiceFields.tsx";
import {
  interestedChipSelected,
  interestedInDisplayOptions,
  interestedInGenderCodes,
  toggleInterestedIn,
} from "./interestedIn.ts";
import { fieldError } from "./onboardingErrors.ts";

type Props = {
  interestedField?: ConfiguredField;
  interestedIn: string[];
  onInterestedIn: (value: string[]) => void;
  onSubmit: () => Promise<void>;
  pending: boolean;
  error?: string;
  details?: Record<string, string[]>;
};

export function PreferencesForm({
  interestedField,
  interestedIn,
  onInterestedIn,
  onSubmit,
  pending,
  error,
  details,
}: Props) {
  const errorId = useId();
  const [localError, setLocalError] = useState<string | undefined>();
  const genderCodes = useMemo(
    () => interestedInGenderCodes(interestedField?.options ?? []),
    [interestedField],
  );
  const options = useMemo(
    () => interestedInDisplayOptions(interestedField?.options ?? []),
    [interestedField],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    if (interestedIn.length === 0) {
      setLocalError("Choose at least one option.");
      return;
    }
    setLocalError(undefined);
    await onSubmit();
  }

  if (!interestedField) {
    return (
      <p className="auth-form__error" role="alert">
        We could not load who you can meet. Refresh and try again.
      </p>
    );
  }

  const message = error ?? localError;

  return (
    <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
      {message ? (
        <p className="auth-form__error" id={errorId} role="alert">
          {message}
        </p>
      ) : null}
      <MultiChoiceField
        legend="Who you want to meet"
        name="interested_in"
        options={options}
        values={interestedIn}
        onChange={onInterestedIn}
        onToggle={(code) => onInterestedIn(toggleInterestedIn(interestedIn, code, genderCodes))}
        isSelected={(code) => interestedChipSelected(interestedIn, code, genderCodes)}
        disabled={pending}
        hideLegend
        error={fieldError(details, "interested_in")}
      />
      <div className="onboard-actions">
        <button className="auth-form__submit" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
