import { useState, type FormEvent } from "react";
import { OpenerUnavailableError, sendOpener } from "../../lib/api/opener.ts";
import { HourglassIcon, PaperPlaneIcon, SparkleIcon } from "../shell/icons.tsx";

export type OpenerView = "compose" | "waiting" | "unlocked";

type Props = {
  profileId: string;
  name: string;
  view: OpenerView;
  onSent: () => void;
};

function initial(name: string): string {
  const letter = name.trim()[0];
  return letter ? letter.toUpperCase() : "?";
}

export function FindOpenerPanel({ profileId, name, view, onSent }: Props) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await sendOpener(profileId, message);
      onSent();
    } catch (caught) {
      if (caught instanceof OpenerUnavailableError) {
        setError("Openers aren’t on DateZA yet. Like them — if you match, you can start a chat.");
      } else {
        setError("We couldn’t send that opener. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (view === "waiting") {
    return (
      <section className="find-rail-card find-waiting" aria-label="Waiting for reply">
        <div className="find-waiting__mark" aria-hidden="true">
          <SparkleIcon className="find-waiting__sparkle find-waiting__sparkle--a" />
          <HourglassIcon className="find-waiting__hourglass" />
          <SparkleIcon className="find-waiting__sparkle find-waiting__sparkle--b" />
        </div>
        <h2 className="find-rail-card__title">Waiting for reply</h2>
        <p className="find-rail-card__body">Your opener was sent. We’ll let you know when {name} replies.</p>
      </section>
    );
  }

  if (view === "unlocked") {
    return (
      <section className="find-rail-card" aria-label="Conversation unlocked">
        <h2 className="find-rail-card__title">Conversation unlocked</h2>
        <p className="find-rail-card__body">{name} replied. You can keep chatting as usual.</p>
      </section>
    );
  }

  return (
    <section className="find-rail-card" aria-label="Send opener">
      <h2 className="find-rail-card__title">Send your opener</h2>
      <p className="find-rail-card__body">One thoughtful note — then wait for a reply.</p>
      <form className="find-opener-form" onSubmit={(event) => void submit(event)}>
        <label className="sr-only" htmlFor={`opener-${profileId}`}>
          Opener message
        </label>
        <div className="find-opener-form__row">
          <span className="find-opener-form__avatar" aria-hidden="true">
            {initial(name)}
          </span>
          <div className="find-opener-form__bubble">
            <textarea
              id={`opener-${profileId}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={280}
              rows={3}
              placeholder={`Hey ${name} — what should they know?`}
            />
            <button type="submit" className="find-opener-form__icon-send" disabled={busy || draft.trim().length === 0} aria-label="Send opener">
              <PaperPlaneIcon className="find-opener-form__icon" />
            </button>
          </div>
        </div>
      </form>
      {error ? (
        <p className="find-rail-card__error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
