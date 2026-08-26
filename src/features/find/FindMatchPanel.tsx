import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startConversation } from "../../lib/api/social.ts";
import { HeartIcon, SparkleIcon } from "../shell/icons.tsx";

type Props = {
  name: string;
  photoUrl?: string;
  selfPhotoUrl?: string;
  matchId: string | null;
  onKeepFinding: () => void;
};

export function FindMatchPanel({ name, photoUrl, selfPhotoUrl, matchId, onKeepFinding }: Props) {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(false);

  async function startChat() {
    if (!matchId || starting) return;
    setStarting(true);
    setError(false);
    try {
      const conversation = await startConversation(matchId);
      navigate(`/chats?conversation=${conversation.id}`);
    } catch {
      setError(true);
      setStarting(false);
    }
  }

  return (
    <section className="find-rail-card find-match-card" aria-label="It's a match!">
      <div className="find-match-card__faces" aria-hidden="true">
        {selfPhotoUrl ? <img src={selfPhotoUrl} alt="" /> : <span className="find-match-card__face" />}
        <HeartIcon className="find-match-card__heart" />
        {photoUrl ? <img src={photoUrl} alt="" /> : <span className="find-match-card__face" />}
      </div>
      <h2 className="find-rail-card__title">
        <SparkleIcon className="find-rail-card__title-icon" />
        It's a match!
      </h2>
      <p className="find-rail-card__body">You and {name} liked each other.</p>
      {error ? (
        <p className="find-rail-card__error" role="alert">
          That chat couldn’t open. Try again.
        </p>
      ) : null}
      <div className="find-match-card__actions">
        <button type="button" className="shell-primary-action find-match-card__primary" onClick={() => void startChat()} disabled={!matchId || starting}>
          {starting ? "Opening…" : "Start chatting"}
        </button>
        <button type="button" className="find-match-card__ghost" onClick={onKeepFinding}>
          Keep discovering
        </button>
      </div>
    </section>
  );
}
