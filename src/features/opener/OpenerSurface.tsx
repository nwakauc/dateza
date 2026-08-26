import { Link } from "react-router-dom";
import { type ConfiguredOpener, type OpenerState } from "../../lib/api/openerTypes.ts";
import type { Conversation } from "../../lib/api/socialTypes.ts";
import { FindConversationPreview } from "../find/FindConversationPreview.tsx";
import { OpenerChooser } from "./OpenerChooser.tsx";
import { OpenerWaiting } from "./OpenerWaiting.tsx";

type Props = {
  profileId: string;
  name: string;
  online?: boolean;
  catalogue: ConfiguredOpener[];
  catalogueLoading?: boolean;
  openerState: OpenerState | undefined;
  sentText?: string;
  conversation?: Conversation;
  onSent: (text: string, expiresAt: string) => void;
  onRetryCatalogue?: () => void;
};

export function OpenerSurface({
  profileId,
  name,
  online,
  catalogue,
  catalogueLoading,
  openerState,
  sentText,
  conversation,
  onSent,
  onRetryCatalogue,
}: Props) {
  if (openerState === "pending") {
    return <OpenerWaiting name={name} sentText={sentText} />;
  }

  if (openerState === "hooked" && conversation) {
    return <FindConversationPreview conversation={conversation} online={online} />;
  }

  if (openerState === "hooked") {
    return (
      <section className="find-rail-card" aria-label="Conversation">
        <h2 className="find-rail-card__title">Conversation unlocked</h2>
        <p className="find-rail-card__body">You can keep chatting as usual.</p>
        <Link className="find-rail-card__link" to="/chats">
          Open chats →
        </Link>
      </section>
    );
  }

  if (catalogueLoading) {
    return (
      <section className="find-rail-card" aria-busy="true" aria-label="Send opener">
        <h2 className="find-rail-card__title">Send {name} an opener</h2>
        <p className="find-rail-card__body">Loading opener lines…</p>
      </section>
    );
  }

  if (catalogue.length === 0) {
    return (
      <section className="find-rail-card" aria-label="Send opener">
        <h2 className="find-rail-card__title">Send {name} an opener</h2>
        <p className="find-rail-card__body">We couldn’t load opener lines. Try again.</p>
        {onRetryCatalogue ? (
          <button type="button" className="opener-chooser__send" onClick={onRetryCatalogue}>
            Try again
          </button>
        ) : null}
      </section>
    );
  }

  return <OpenerChooser profileId={profileId} name={name} catalogue={catalogue} onSent={onSent} />;
}
