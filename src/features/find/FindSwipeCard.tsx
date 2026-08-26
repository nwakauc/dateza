import { useState, type KeyboardEvent } from "react";
import type { FindProfile } from "../../lib/api/findTypes.ts";
import { ProfileSafetyActions } from "../profile/ProfileSafetyActions.tsx";
import { CheckCircleIcon, HeartIcon } from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";
import { cardQuote, findCardChips, locationLine } from "./findCardCopy.ts";
import type { OptionLabelLookup } from "./optionLabels.ts";

type InteractionState = "idle" | "liked" | "matched" | "passed";

type Props = {
  profile: FindProfile;
  interaction: InteractionState;
  optionLabel: OptionLabelLookup;
  onOpenDetail: () => void;
  onBlocked?: () => void;
};

export function FindSwipeCard({ profile, interaction, optionLabel, onOpenDetail, onBlocked }: Props) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = profile.photos;
  const activePhoto = photos[photoIndex];

  function showPhoto(index: number) {
    setPhotoIndex(Math.max(0, Math.min(index, photos.length - 1)));
  }

  function onPhotoKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showPhoto(photoIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPhoto(photoIndex - 1);
    }
  }

  const location = locationLine(profile);
  const chips = findCardChips(profile, optionLabel);
  const quote = cardQuote(profile);
  const name = profile.display_name ?? "DateZA member";

  return (
    <article className="find-card" aria-label={`${name}${profile.age ? `, ${profile.age}` : ""}`}>
      <div
        className="find-card__photo"
        tabIndex={photos.length > 1 ? 0 : undefined}
        onKeyDown={photos.length > 1 ? onPhotoKey : undefined}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          if (photos.length > 1) return;
          onOpenDetail();
        }}
      >
        {activePhoto ? (
          <img src={activePhoto.url} alt="" loading="lazy" decoding="async" />
        ) : (
          <div className="find-card__photo-placeholder" aria-hidden="true" />
        )}

        {photos.length > 0 ? (
          <span className="find-card__count" aria-hidden="true">
            {photoIndex + 1}/{photos.length}
          </span>
        ) : null}
        {photos.length > 1 ? (
          <>
            <div className="find-card__photo-indicator" aria-hidden="true">
              {photos.map((photo, index) => (
                <span key={photo.id} className={index === photoIndex ? "find-card__photo-segment find-card__photo-segment--active" : "find-card__photo-segment"} />
              ))}
            </div>
            <span className="sr-only" aria-live="polite">
              Photo {photoIndex + 1} of {photos.length}
            </span>
            <button
              type="button"
              className="find-card__photo-nav find-card__photo-nav--prev"
              aria-label="Previous photo"
              onClick={() => showPhoto(photoIndex - 1)}
              disabled={photoIndex === 0}
            />
            <button
              type="button"
              className="find-card__photo-nav find-card__photo-nav--next"
              aria-label="Next photo"
              onClick={() => showPhoto(photoIndex + 1)}
              disabled={photoIndex === photos.length - 1}
            />
          </>
        ) : null}

        {onBlocked ? (
          <div className="find-card__safety">
            <ProfileSafetyActions profileId={profile.id} name={name} onBlocked={onBlocked} />
          </div>
        ) : null}

        {interaction === "matched" ? <span className="find-card__match-note">It's a match!</span> : null}

        <div className="find-card__scrim">
          <div className="find-card__headline">
            <button
              type="button"
              className="find-card__name"
              onClick={onOpenDetail}
              aria-label={`Open ${name}'s full profile`}
            >
              {name}
              {profile.age ? <span className="find-card__age">, {profile.age}</span> : null}
            </button>
            {profile.verified ? <CheckCircleIcon className="find-card__name-verified" /> : null}
          </div>
          {location ? <p className="find-card__location">{location}</p> : null}

          {profile.compatibility || profile.verified ? (
            <div className="find-card__badges">
              {profile.compatibility ? (
                <span className="find-card__badge find-card__badge--score">
                  <HeartIcon className="find-card__badge-icon" />
                  {profile.compatibility.score}% compatible
                </span>
              ) : null}
              {profile.verified ? (
                <span className="find-card__badge find-card__badge--verified">
                  <CheckCircleIcon className="find-card__badge-icon" /> {VERIFIED_CONTACT_LABEL}
                </span>
              ) : null}
            </div>
          ) : null}

          {chips.length > 0 ? (
            <div className="find-card__chips">
              {chips.map((label) => (
                <span className="find-card__chip" key={label}>
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          {quote ? <p className="find-card__bio">"{quote}"</p> : null}
        </div>
      </div>
    </article>
  );
}
