import type { DiscoveryProfile } from "../../lib/api/discoveryTypes.ts";
import { HeartIcon, ShieldCheckIcon } from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";
import { findCardChips, locationLine } from "../find/findCardCopy.ts";
import type { OptionLabelLookup } from "../find/optionLabels.ts";

type InteractionState = "idle" | "liked" | "matched" | "passed";

const noOptionLabel: OptionLabelLookup = () => undefined;

type Props = {
  profile: DiscoveryProfile;
  interaction: InteractionState;
  onOpen: () => void;
  onLike: () => void;
  pending: boolean;
  optionLabel?: OptionLabelLookup;
  /** Only the first photo is loaded; remaining count is metadata. */
  eagerPhoto?: boolean;
};

export function DiscoveryCard({
  profile,
  interaction,
  onOpen,
  onLike,
  pending,
  optionLabel = noOptionLabel,
  eagerPhoto = false,
}: Props) {
  const photo = profile.photos[0];
  const location = locationLine(profile);
  const traits = findCardChips(profile, optionLabel).slice(0, 2);
  const liked = interaction === "liked" || interaction === "matched";
  const name = profile.display_name ?? "DateZA member";

  return (
    <article className="discovery-card">
      <button
        className="discovery-card__photo"
        type="button"
        onClick={onOpen}
        aria-label={`Open ${name}'s profile`}
      >
        {photo ? (
          <img src={photo.url} alt="" loading={eagerPhoto ? "eager" : "lazy"} decoding="async" />
        ) : (
          <div className="discover-card__photo-placeholder" aria-hidden="true" />
        )}
        {profile.online ? (
          <span className="discovery-card__status discovery-card__status--online">Online</span>
        ) : profile.new_here ? (
          <span className="discovery-card__status discovery-card__status--new">New here</span>
        ) : null}
        <div className="discovery-card__scrim">
          <div className="discovery-card__name-row">
            <span className="discovery-card__display-name">{name}</span>
            {profile.age ? <span className="discovery-card__age">, {profile.age}</span> : null}
            {profile.verified ? (
              <span className="discovery-card__verified">
                <ShieldCheckIcon className="discovery-card__verified-icon" />
                <span className="discovery-card__sr">{VERIFIED_CONTACT_LABEL}</span>
              </span>
            ) : null}
          </div>
          {location ? <p className="discovery-card__location">{location}</p> : null}
          {profile.compatibility ? (
            <span className="discovery-card__score">{profile.compatibility.score}% match</span>
          ) : null}
          {traits.length > 0 ? (
            <div className="discovery-card__badges">
              {traits.map((trait) => (
                <span className="discovery-card__trait" key={trait}>
                  {trait}
                </span>
              ))}
            </div>
          ) : null}
          {profile.photos.length > 1 ? (
            <span className="discovery-card__photos">1 / {profile.photos.length}</span>
          ) : null}
        </div>
      </button>
      {interaction === "matched" ? (
        <span className="discovery-card__match-note">It's a match!</span>
      ) : (
        <button
          className={`discovery-card__like${liked ? " discovery-card__like--on" : ""}`}
          type="button"
          onClick={onLike}
          disabled={pending || liked || interaction === "passed"}
          aria-label={liked ? "Liked" : "Like"}
        >
          <HeartIcon className="discovery-card__icon" filled={liked} />
        </button>
      )}
    </article>
  );
}
