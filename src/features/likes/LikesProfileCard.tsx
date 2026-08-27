import { Link } from "react-router-dom";
import type { DatezaCompatibility, PublicProfile } from "../../lib/api/findTypes.ts";
import { findCardChips, placeLine } from "../find/findCardCopy.ts";
import type { OptionLabelLookup } from "../find/optionLabels.ts";
import { ChatIcon, HeartIcon } from "../shell/icons.tsx";

export type LikesCardKind = "mutual" | "incoming" | "outgoing";

type Props = {
  profile: PublicProfile;
  optionLabel: OptionLabelLookup;
  kind: LikesCardKind;
  compatibility?: DatezaCompatibility;
  conversationId?: string;
  messaging?: boolean;
  liking?: boolean;
  onMessage?: () => void;
  onLikeBack?: () => void;
};

export function LikesProfileCard({
  profile,
  optionLabel,
  kind,
  compatibility,
  conversationId,
  messaging,
  liking,
  onMessage,
  onLikeBack,
}: Props) {
  const photo = profile.photos[0];
  const name = profile.display_name || "DateZA member";
  const place = placeLine(profile);
  const chips = findCardChips(profile, optionLabel).slice(0, 2);
  const profileTo = `/profile/${profile.id}`;
  const profileState = { from: "likes" as const, compatibility: compatibility ?? null };
  const score = compatibility?.score;

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
        {kind === "mutual" ? <span className="likes-card__badge">Matched</span> : null}
        {kind === "incoming" ? <span className="likes-card__badge">Liked you</span> : null}
        {kind === "outgoing" ? <span className="likes-card__badge likes-card__badge--sent">You liked</span> : null}
        {score != null ? <span className="likes-card__score">{score}%</span> : null}
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
        {kind === "mutual" && onMessage ? (
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
        ) : null}
        {kind === "incoming" && onLikeBack ? (
          <button
            type="button"
            className="likes-card__message"
            aria-label={`Like ${name} back`}
            onClick={onLikeBack}
            disabled={liking}
          >
            {liking ? (
              "Liking…"
            ) : (
              <>
                <HeartIcon filled />
                Like back
              </>
            )}
          </button>
        ) : null}
        {kind === "outgoing" ? (
          <Link className="likes-card__message" to={profileTo} state={profileState}>
            View
          </Link>
        ) : null}
      </div>
      <span className="likes-card__heart" aria-hidden="true">
        <HeartIcon filled />
      </span>
    </article>
  );
}
