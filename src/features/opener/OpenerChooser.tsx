import { useRef, useState } from "react";
import type { ConfiguredOpener } from "../../lib/api/openerTypes.ts";
import { openerSendErrorCopy, sendOpener } from "../../lib/api/opener.ts";

const INITIAL_VISIBLE = 3;

type Props = {
  profileId: string;
  name: string;
  catalogue: ConfiguredOpener[];
  disabled?: boolean;
  onSent: (text: string, expiresAt: string) => void;
};

export function OpenerChooser({ profileId, name, catalogue, disabled, onSent }: Props) {
  const [selected, setSelected] = useState<string | undefined>(catalogue[0]?.key);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const [error, setError] = useState<string | undefined>();

  const shown = expanded ? catalogue : catalogue.slice(0, INITIAL_VISIBLE);
  const hasMore = catalogue.length > INITIAL_VISIBLE;

  async function submit() {
    if (!selected || sending.current || busy || disabled) return;
    sending.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const result = await sendOpener(profileId, selected);
      const text = catalogue.find((item) => item.key === selected)?.text ?? "";
      onSent(text, result.opener.expires_at);
      return;
    } catch (caught) {
      sending.current = false;
      setBusy(false);
      setError(openerSendErrorCopy(caught));
    }
  }

  if (catalogue.length === 0) {
    return null;
  }

  return (
    <section id="find-opener-surface" className="find-rail-card opener-chooser" aria-label="Send opener">
      <h2 className="find-rail-card__title">Send {name} an opener</h2>
      <p className="find-rail-card__body">Choose something genuine to start the conversation.</p>
      <fieldset className="opener-chooser__list" disabled={busy || disabled}>
        <legend className="sr-only">Choose one opener</legend>
        {shown.map((item) => {
          const checked = selected === item.key;
          return (
            <label key={item.key} className={checked ? "opener-chooser__option opener-chooser__option--selected" : "opener-chooser__option"}>
              <input
                type="radio"
                name={`opener-${profileId}`}
                value={item.key}
                checked={checked}
                onChange={() => setSelected(item.key)}
              />
              <span>{item.text}</span>
            </label>
          );
        })}
      </fieldset>
      {hasMore ? (
        <button type="button" className="opener-chooser__more" onClick={() => setExpanded((open) => !open)}>
          {expanded ? "Show fewer" : "See more"}
        </button>
      ) : null}
      {error ? (
        <p className="find-rail-card__error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="opener-chooser__send"
        onClick={() => void submit()}
        disabled={!selected || busy || disabled}
      >
        {busy ? "Sending…" : "Send opener"}
      </button>
    </section>
  );
}
