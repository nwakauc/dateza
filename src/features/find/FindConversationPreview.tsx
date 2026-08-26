import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { sendMessage } from "../../lib/api/social.ts";
import type { Conversation } from "../../lib/api/socialTypes.ts";
import { PaperPlaneIcon } from "../shell/icons.tsx";

type Props = {
  conversation: Conversation;
  online?: boolean;
};

export function FindConversationPreview({ conversation, online = false }: Props) {
  const name = conversation.profile.display_name ?? "this person";
  const photo = conversation.profile.photos[0]?.url;
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [lastBody, setLastBody] = useState(conversation.last_message?.body);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const message = await sendMessage(conversation.id, body);
      setLastBody(message.body);
      setDraft("");
    } catch {
      setError("That message didn’t send. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="find-rail-card find-convo" aria-label="Conversation">
      <div className="find-convo__head">
        {photo ? <img className="find-convo__photo" src={photo} alt="" /> : <span className="find-convo__photo" aria-hidden="true" />}
        <div>
          <h2 className="find-rail-card__title">{name}</h2>
          {online ? <p className="find-rail-card__meta">Online now</p> : null}
        </div>
      </div>
      {lastBody ? (
        <p className="find-convo__bubble">
          {lastBody}
        </p>
      ) : (
        <p className="find-rail-card__body">Say hello.</p>
      )}
      <form className="find-quick-reply" onSubmit={(event) => void submit(event)}>
        <label className="sr-only" htmlFor={`quick-${conversation.id}`}>
          Message
        </label>
        <input
          id={`quick-${conversation.id}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message…"
          maxLength={1000}
        />
        <button type="submit" aria-label="Send message" disabled={busy || draft.trim().length === 0}>
          <PaperPlaneIcon className="find-quick-reply__icon" />
        </button>
      </form>
      {error ? (
        <p className="find-rail-card__error" role="alert">
          {error}
        </p>
      ) : null}
      <Link className="find-rail-card__link" to={`/chats?conversation=${conversation.id}`}>
        Open chat →
      </Link>
    </section>
  );
}
