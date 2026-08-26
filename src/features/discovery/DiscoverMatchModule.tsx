import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startConversation } from "../../lib/api/social.ts";
import { HeartIcon } from "../shell/icons.tsx";

type Props = {
  name: string;
  photoUrl?: string;
  selfPhotoUrl?: string;
  matchId: string | null;
  onKeepDiscovering: () => void;
};

export function DiscoverMatchModule({ name, photoUrl, selfPhotoUrl, matchId, onKeepDiscovering }: Props) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [messageError, setMessageError] = useState(false);

  async function message() {
    if (!matchId || starting) return;
    setStarting(true);
    setMessageError(false);
    try {
      const conversation = await startConversation(matchId);
      navigate(`/chats?conversation=${conversation.id}`);
    } catch {
      setMessageError(true);
      setStarting(false);
    }
  }

  return (
    <section className="discover-rail-card discover-match-card" aria-label="It's a match!">
      <h2 className="discover-rail-card__title">It's a match!</h2>
      <div className="discover-match-card__faces" aria-hidden="true">
        {selfPhotoUrl ? <img src={selfPhotoUrl} alt="" /> : <span className="discover-match-card__face" />}
        <HeartIcon className="discover-match-card__heart" />
        {photoUrl ? <img src={photoUrl} alt="" /> : <span className="discover-match-card__face" />}
      </div>
      <p className="discover-rail-card__body">You and {name} liked each other.</p>
      {messageError ? (
        <p className="discover-rail-card__error" role="alert">
          That chat couldn't open. Try again.
        </p>
      ) : null}
      <div className="discover-match-card__actions">
        <button
          type="button"
          className="shell-primary-action"
          onClick={() => void message()}
          disabled={!matchId || starting}
        >
          {starting ? "Opening…" : "Send a message"}
        </button>
        <button type="button" className="discover-match-card__ghost" onClick={onKeepDiscovering}>
          Keep discovering
        </button>
      </div>
    </section>
  );
}
