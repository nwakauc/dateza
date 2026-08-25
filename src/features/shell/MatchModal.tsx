import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startConversation } from "../../lib/api/social.ts";
import { Modal } from "../verification/Modal.tsx";
import { HeartIcon } from "./icons.tsx";

type Props = {
  name: string;
  photoUrl?: string;
  matchId: string | null;
  continueLabel: string;
  onContinue: () => void;
};

/**
 * The real backend has no "opener" concept (see handoff): conversations only
 * exist once a mutual match already does, via `POST /matches/{id}/conversation`
 * (the same call LikesPage's "Message" button already uses). So the
 * celebratory match moment's one real, working action is opening that
 * conversation — not a fabricated opener/waiting state.
 */
export function MatchModal({ name, photoUrl, matchId, continueLabel, onContinue }: Props) {
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
        {photoUrl ? (
          <img className="match-modal__photo" src={photoUrl} alt="" />
        ) : (
          <span className="match-modal__photo match-modal__photo--placeholder" aria-hidden="true" />
        )}
        <HeartIcon className="match-modal__heart" />
        <h2 className="match-modal__title">It's a match!</h2>
        <p className="match-modal__body">You matched with {name}!</p>
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
            {starting ? "Opening…" : `Message ${name}`}
          </button>
          <button type="button" className="shell-text-action" onClick={onContinue}>
            {continueLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
