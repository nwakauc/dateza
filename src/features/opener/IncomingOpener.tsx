import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { declineOpener, openerDeclineErrorCopy, openerReplyErrorCopy, replyToOpener } from "../../lib/api/opener.ts";
import type { ReceivedOpener } from "../../lib/api/openerTypes.ts";
import type { Conversation } from "../../lib/api/socialTypes.ts";
import { ProfileSafetyActions } from "../profile/ProfileSafetyActions.tsx";
import { conversationWithPreview } from "../chats/chatDisplay.ts";
import { openerExpiryCopy } from "./openerExpiry.ts";

type Props = {
  opener: ReceivedOpener;
  onResolved: () => void;
  onReplied: (openerId: string, conversation: Conversation) => void;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function IncomingOpener({ opener, onResolved, onReplied }: Props) {
  const navigate = useNavigate();
  const name = opener.sender.display_name ?? "Someone";
  const photo = opener.sender.photos[0]?.url;
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"reply" | "decline" | undefined>();
  const [error, setError] = useState<string | undefined>();
  const expiry = openerExpiryCopy(opener.expires_at);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setBusy("reply");
    setError(undefined);
    try {
      const result = await replyToOpener(opener.id, message);
      onReplied(opener.id, conversationWithPreview(result.conversation, result.message));
      navigate(`/chats?conversation=${result.conversation.id}`);
    } catch (caught) {
      setError(openerReplyErrorCopy(caught));
    } finally {
      setBusy(undefined);
    }
  }

  async function decline() {
    if (busy) return;
    setBusy("decline");
    setError(undefined);
    try {
      await declineOpener(opener.id);
      onResolved();
    } catch (caught) {
      setError(openerDeclineErrorCopy(caught));
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <article className="incoming-opener">
      <header className="incoming-opener__head">
        {photo ? <img src={photo} alt="" /> : <span className="incoming-opener__face" aria-hidden="true" />}
        <div>
          <h3>{name} sent you an opener</h3>
          <p className="incoming-opener__meta">
            <time dateTime={opener.created_at}>{relativeTime(opener.created_at)}</time>
            {expiry ? (
              <>
                <span aria-hidden="true"> · </span>
                <time dateTime={opener.expires_at}>{expiry}</time>
              </>
            ) : null}
          </p>
        </div>
        <ProfileSafetyActions profileId={opener.sender.id} name={name} onBlocked={onResolved} />
      </header>
      <p className="incoming-opener__quote">“{opener.message}”</p>
      <form onSubmit={(event) => void submit(event)}>
        <label className="sr-only" htmlFor={`reply-${opener.id}`}>
          Your reply
        </label>
        <textarea
          id={`reply-${opener.id}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Write your reply…"
          disabled={busy === "reply"}
        />
        {error ? (
          <p className="find-rail-card__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="incoming-opener__actions">
          <button type="submit" className="opener-chooser__send" disabled={busy !== undefined || draft.trim().length === 0}>
            {busy === "reply" ? "Sending…" : "Reply"}
          </button>
          <button type="button" className="incoming-opener__decline" onClick={() => void decline()} disabled={busy !== undefined}>
            {busy === "decline" ? "Declining…" : "Not interested"}
          </button>
        </div>
      </form>
    </article>
  );
}
