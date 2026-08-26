import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startConversation } from "../../lib/api/social.ts";
import { Modal } from "../verification/Modal.tsx";
import { HeartIcon } from "./icons.tsx";

type Props = {
  name: string;
  photoUrl?: string;
  selfPhotoUrl?: string;
  matchId: string | null;
  continueLabel: string;
  onContinue: () => void;
};

/**
 * Mutual-like celebration. Conversation exists after a match via
 * `POST /matches/{id}/conversation`. Opener is a separate pre-chat contract
 * and is not a substitute for this match chat action.
 */
export function MatchModal({ name, photoUrl, selfPhotoUrl, matchId, continueLabel, onContinue }: Props) {
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
    <Modal ariaLabel="It's a match!" onClose={onContinue}>
      <div className="match-modal">
        <div className="match-modal__faces" aria-hidden="true">
          {selfPhotoUrl ? (
            <img className="match-modal__photo" src={selfPhotoUrl} alt="" />
          ) : (
            <span className="match-modal__photo match-modal__photo--placeholder" />
          )}
          <HeartIcon className="match-modal__heart" />
          {photoUrl ? (
            <img className="match-modal__photo" src={photoUrl} alt="" />
          ) : (
            <span className="match-modal__photo match-modal__photo--placeholder" />
          )}
        </div>
        <h2 className="match-modal__title">It's a match! 🎉</h2>
        <p className="match-modal__body">You and {name} like each other.</p>
        {messageError ? (
          <p className="match-modal__error" role="alert">
            That chat couldn't open. Try again.
          </p>
        ) : null}
        <div className="match-modal__actions">
          <button
            type="button"
            className="shell-primary-action match-modal__primary"
            onClick={() => void message()}
            disabled={!matchId || starting}
            data-autofocus
          >
            {starting ? "Opening…" : "Send a message"}
          </button>
          <button type="button" className="shell-text-action" onClick={onContinue}>
            {continueLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
