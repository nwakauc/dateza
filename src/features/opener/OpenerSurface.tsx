import { Link } from "react-router-dom";
import { type ConfiguredOpener, type OpenerState } from "../../lib/api/openerTypes.ts";
import type { Conversation } from "../../lib/api/socialTypes.ts";
import { FindConversationPreview } from "../find/FindConversationPreview.tsx";
import { OpenerChooser } from "./OpenerChooser.tsx";
import { OpenerWaiting } from "./OpenerWaiting.tsx";

const OPENER_SURFACE_ID = "find-opener-surface";

type Props = {
  profileId: string;
  name: string;
  online?: boolean;
  catalogue: ConfiguredOpener[];
  catalogueLoading?: boolean;
  catalogueFailed?: boolean;
  openerState: OpenerState | undefined;
  sentText?: string;
  expiresAt?: string;
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
  catalogueFailed,
  openerState,
  sentText,
  expiresAt,
  conversation,
  onSent,
  onRetryCatalogue,
}: Props) {
  if (openerState === "pending") {
    return <OpenerWaiting name={name} sentText={sentText} expiresAt={expiresAt} />;
  }

  if (openerState === "unavailable") {
    return (
      <section id={OPENER_SURFACE_ID} className="find-rail-card" aria-label="Opener unavailable">
        <h2 className="find-rail-card__title">Opener unavailable</h2>
        <p className="find-rail-card__body">An opener isn’t available for this person.</p>
      </section>
    );
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
      <section id={OPENER_SURFACE_ID} className="find-rail-card" aria-busy="true" aria-label="Send opener">
        <h2 className="find-rail-card__title">Send {name} an opener</h2>
        <p className="find-rail-card__body">Loading opener lines…</p>
      </section>
    );
  }

  if (catalogueFailed) {
    return (
      <section id={OPENER_SURFACE_ID} className="find-rail-card" aria-label="Send opener">
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

  if (catalogue.length === 0) {
    return (
      <section id={OPENER_SURFACE_ID} className="find-rail-card" aria-label="Send opener">
        <h2 className="find-rail-card__title">Send {name} an opener</h2>
        <p className="find-rail-card__body">
          Openers aren’t available yet. You can still like or pass.
        </p>
      </section>
    );
  }

  return <OpenerChooser profileId={profileId} name={name} catalogue={catalogue} onSent={onSent} />;
}
