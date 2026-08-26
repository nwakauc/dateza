import type { ConfiguredOptionGroup } from "../../../lib/api/profileTypes.ts";
import { optionGroupChoices } from "../../onboarding/presentation.ts";
import { MATCHING_ONLY_KEYS, isPublicVisibility } from "./sections.ts";
import { PrivacyNote, SelectField } from "./FieldControls.tsx";

type Props = {
  groups: ConfiguredOptionGroup[];
  selections: Record<string, string[]>;
  onSelect: (groupKey: string, code: string) => void;
  disabled?: boolean;
};

export function OptionSelects({ groups, selections, onSelect, disabled }: Props) {
  if (groups.length === 0) return null;
  const matching = groups.some((group) => MATCHING_ONLY_KEYS.has(group.key) || !isPublicVisibility(group.visibility));
  return (
    <>
      <div className="edit-profile__grid">
        {groups.map((group) => (
          <SelectField
            key={group.key}
            id={`edit-${group.key}`}
            label={group.label}
            value={selections[group.key]?.[0] ?? ""}
            onChange={(code) => onSelect(group.key, code)}
            options={optionGroupChoices(group.key, group.options)}
            disabled={disabled}
            placeholder="Select"
          />
        ))}
      </div>
      {matching ? <PrivacyNote>Matching-only answers never appear on your public profile.</PrivacyNote> : null}
    </>
  );
}
