import { useState } from "react";
import type { ConfiguredPrompt } from "../../lib/api/profileTypes.ts";
import type { PromptAnswer } from "../../lib/api/findTypes.ts";

const MAX_PROMPTS = 5;
const MAX_ANSWER = 300;

type Draft = { key: string; answer: string };

type Props = {
  definitions: ConfiguredPrompt[];
  answers: PromptAnswer[];
  onSave: (answers: Draft[]) => Promise<void>;
  pending: boolean;
  error?: string;
};

export function PromptEditor({ definitions, answers, onSave, pending, error }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    [...answers]
      .sort((left, right) => left.position - right.position)
      .map((item) => ({ key: item.key, answer: item.answer })),
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const used = new Set(drafts.map((item) => item.key));
  const available = definitions.filter((item) => !used.has(item.key));
  const textFor = (key: string) =>
    definitions.find((item) => item.key === key)?.text ??
    answers.find((item) => item.key === key)?.prompt ??
    "Profile prompt";

  function add(key: string) {
    if (drafts.length >= MAX_PROMPTS || used.has(key)) return;
    setDrafts((current) => [...current, { key, answer: "" }]);
    setPickerOpen(false);
  }

  function move(index: number, delta: number) {
    const next = index + delta;
    if (next < 0 || next >= drafts.length) return;
    setDrafts((current) => {
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      if (!item) return current;
      copy.splice(next, 0, item);
      return copy;
    });
  }

  if (definitions.length === 0 && drafts.length === 0) {
    return <p className="profile-section__text">Prompts are not available for your profile yet.</p>;
  }

  return (
    <div className="prompt-editor">
      <p className="profile-section__text">
        Choose up to {MAX_PROMPTS} prompts. These appear on your public profile in this order.
      </p>
      {drafts.map((draft, index) => (
        <article className="prompt-editor__card" key={draft.key}>
          <header className="prompt-editor__head">
            <p className="prompt-editor__question">{textFor(draft.key)}</p>
            <div className="prompt-editor__tools">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0 || pending} aria-label="Move up">
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === drafts.length - 1 || pending}
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setDrafts((current) => current.filter((item) => item.key !== draft.key))}
                disabled={pending}
              >
                Remove
              </button>
            </div>
          </header>
          <textarea
            value={draft.answer}
            maxLength={MAX_ANSWER}
            rows={4}
            disabled={pending}
            onChange={(event) => {
              const value = event.target.value.slice(0, MAX_ANSWER);
              setDrafts((current) => current.map((item) => (item.key === draft.key ? { ...item, answer: value } : item)));
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

      {error ? (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        className="auth-form__submit"
        type="button"
        disabled={pending || drafts.some((item) => !item.answer.trim())}
        onClick={() => void onSave(drafts.map((item) => ({ key: item.key, answer: item.answer.trim() })))}
      >
        {pending ? "Saving…" : "Save prompts"}
      </button>
    </div>
  );
}
