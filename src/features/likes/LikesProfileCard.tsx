import { Link } from "react-router-dom";
import type { PublicProfile } from "../../lib/api/findTypes.ts";
import { findCardChips, placeLine } from "../find/findCardCopy.ts";
import type { OptionLabelLookup } from "../find/optionLabels.ts";
import { ChatIcon, HeartIcon } from "../shell/icons.tsx";

type Props = {
  profile: PublicProfile;
  optionLabel: OptionLabelLookup;
  conversationId?: string;
  messaging?: boolean;
  onMessage: () => void;
};

export function LikesProfileCard({ profile, optionLabel, conversationId, messaging, onMessage }: Props) {
  const photo = profile.photos[0];
  const name = profile.display_name || "DateZA member";
  const place = placeLine(profile);
  const chips = findCardChips(profile, optionLabel).slice(0, 2);
  const profileTo = `/profile/${profile.id}`;
  const profileState = { from: "likes" as const };

  return (
    <article className="likes-card">
      <Link className="likes-card__photo" to={profileTo} state={profileState} aria-label={`Open ${name}'s profile`}>
        {photo ? (
          <img src={photo.url} alt="" width="480" height="600" loading="lazy" decoding="async" />
        ) : (
          <span className="likes-card__placeholder" aria-hidden="true">
            {name[0]?.toUpperCase()}
          </span>
        )}
        <span className="likes-card__badge">Matched</span>
        <div className="likes-card__scrim">
          <p className="likes-card__name">
            {name}
            {profile.age ? <span>, {profile.age}</span> : null}
          </p>
          {place ? <p className="likes-card__place">{place}</p> : null}
          {chips.length > 0 ? (
            <div className="likes-card__chips">
              {chips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
      <div className="likes-card__bar">
        <Link className="likes-card__name-link" to={profileTo} state={profileState}>
          {name}
          {profile.age ? `, ${profile.age}` : ""}
        </Link>
        <button
          type="button"
          className="likes-card__message"
          aria-label={conversationId ? `Open chat with ${name}` : `Message ${name}`}
          onClick={onMessage}
          disabled={messaging}
        >
          {messaging ? (
            "Opening…"
          ) : (
            <>
              <ChatIcon />
              {conversationId ? "Chat" : "Message"}
            </>
          )}
        </button>
      </div>
      <span className="likes-card__heart" aria-hidden="true">
        <HeartIcon filled />
      </span>
    </article>
  );
}
