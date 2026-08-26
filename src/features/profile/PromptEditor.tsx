import { useState } from "react";
import type { ConfiguredPrompt } from "../../lib/api/profileTypes.ts";
import type { PromptDraft } from "./promptDrafts.ts";

const MAX_PROMPTS = 5;
const MAX_ANSWER = 300;

type Props = {
  definitions: ConfiguredPrompt[];
  drafts: PromptDraft[];
  onChange: (drafts: PromptDraft[]) => void;
  pending: boolean;
};

export function PromptEditor({ definitions, drafts, onChange, pending }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const used = new Set(drafts.map((item) => item.key));
  const available = definitions.filter((item) => !used.has(item.key));
  const textFor = (key: string) => definitions.find((item) => item.key === key)?.text ?? "Profile prompt";

  function add(key: string) {
    if (drafts.length >= MAX_PROMPTS || used.has(key)) return;
    onChange([...drafts, { key, answer: "" }]);
    setPickerOpen(false);
  }

  if (definitions.length === 0 && drafts.length === 0) {
    return <p className="profile-section__text">Prompts are not available for your profile yet.</p>;
  }

  return (
    <div className="prompt-editor">
      <p className="edit-profile__lede">A good prompt says more than a long bio. Choose up to {MAX_PROMPTS}.</p>
      {drafts.map((draft) => (
        <article className="prompt-editor__card" key={draft.key}>
          <header className="prompt-editor__head">
            <p className="prompt-editor__question">{textFor(draft.key)}</p>
            <button
              type="button"
              onClick={() => onChange(drafts.filter((item) => item.key !== draft.key))}
              disabled={pending}
            >
              Remove
            </button>
          </header>
          <textarea
            value={draft.answer}
            maxLength={MAX_ANSWER}
            rows={4}
            disabled={pending}
            onChange={(event) => {
              const value = event.target.value.slice(0, MAX_ANSWER);
              onChange(drafts.map((item) => (item.key === draft.key ? { ...item, answer: value } : item)));
            }}
          />
          <p className="prompt-editor__count">
            {draft.answer.length} / {MAX_ANSWER}
          </p>
        </article>
      ))}

      {drafts.length < MAX_PROMPTS && available.length > 0 ? (
        <div className="prompt-editor__add">
          {pickerOpen ? (
            <ul className="prompt-editor__picker">
              {available.map((item) => (
                <li key={item.key}>
                  <button type="button" onClick={() => add(item.key)} disabled={pending}>
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <button className="shell-text-action" type="button" onClick={() => setPickerOpen(true)} disabled={pending}>
              Add a prompt
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
