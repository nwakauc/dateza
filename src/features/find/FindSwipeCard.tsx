import { useState } from "react";
import type { FindProfile } from "../../lib/api/findTypes.ts";
import { InfoIcon, ShieldCheckIcon } from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";
import { describeCompatibilityReasons } from "../discovery/compatibilityCopy.ts";
import type { OptionLabelLookup } from "./optionLabels.ts";

type InteractionState = "idle" | "liked" | "matched" | "passed";

type Props = {
  profile: FindProfile;
  interaction: InteractionState;
  optionLabel: OptionLabelLookup;
  onOpenDetail: () => void;
};

const MAX_INTERESTS_SHOWN = 3;
const MAX_COMPATIBILITY_REASONS_SHOWN = 2;
const BIO_EXCERPT_MAX_CHARS = 110;

function locationLine(profile: FindProfile): string | undefined {
  const place = profile.city ?? profile.country_code ?? undefined;
  const distance = profile.distance_km != null ? `${profile.distance_km} km away` : undefined;
  if (place && distance) return `${place} · ${distance}`;
  return place ?? distance;
}

function bioExcerpt(bio: string | null): string | undefined {
  if (!bio) return undefined;
  const trimmed = bio.trim();
  if (trimmed.length <= BIO_EXCERPT_MAX_CHARS) return trimmed;
  const cut = trimmed.slice(0, BIO_EXCERPT_MAX_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : BIO_EXCERPT_MAX_CHARS)}…`;
}

export function FindSwipeCard({ profile, interaction, optionLabel, onOpenDetail }: Props) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = profile.photos;
  const activePhoto = photos[photoIndex];

  function showPhoto(index: number) {
    setPhotoIndex(Math.max(0, Math.min(index, photos.length - 1)));
  }

  const location = locationLine(profile);
  const reasons = profile.compatibility
    ? describeCompatibilityReasons(profile.compatibility.reasons).slice(0, MAX_COMPATIBILITY_REASONS_SHOWN)
    : [];
  const relationshipCode = profile.options.relationship_intent?.[0];
  const relationshipLabel = relationshipCode ? optionLabel("relationship_intent", relationshipCode) : undefined;
  const interestLabels = (profile.options.interests ?? [])
    .slice(0, MAX_INTERESTS_SHOWN)
    .map((code) => optionLabel("interests", code))
    .filter((label): label is string => Boolean(label));
  const bio = bioExcerpt(profile.bio);
  const name = profile.display_name ?? "DateZA member";

  return (
    <article className="find-card" aria-label={`${name}${profile.age ? `, ${profile.age}` : ""}`}>
      <div className="find-card__photo">
        {activePhoto ? (
          <img src={activePhoto.url} alt="" loading="lazy" />
        ) : (
          <div className="find-card__photo-placeholder" aria-hidden="true" />
        )}

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

        <button type="button" className="find-card__info" aria-label={`Open ${name}'s full profile`} onClick={onOpenDetail}>
          <InfoIcon className="find-card__info-icon" />
        </button>

        {interaction === "matched" ? <span className="find-card__match-note">It's a match!</span> : null}

        <div className="find-card__scrim">
          <div className="find-card__headline">
            <span className="find-card__name">{name}</span>
            {profile.age ? <span className="find-card__age">{profile.age}</span> : null}
          </div>
          {location ? <p className="find-card__location">{location}</p> : null}

          {profile.compatibility || profile.verified ? (
            <div className="find-card__badges">
              {profile.compatibility ? (
                <span className="find-card__badge find-card__badge--score">{profile.compatibility.score}% compatible</span>
              ) : null}
              {profile.verified ? (
                <span className="find-card__badge find-card__badge--verified">
                  <ShieldCheckIcon className="find-card__badge-icon" /> {VERIFIED_CONTACT_LABEL}
                </span>
              ) : null}
            </div>
          ) : null}
          {reasons.length > 0 ? <p className="find-card__reasons">{reasons.join(" · ")}</p> : null}

          {relationshipLabel || interestLabels.length > 0 ? (
            <p className="find-card__facts">
              {[relationshipLabel, ...interestLabels].filter(Boolean).join(" · ")}
            </p>
          ) : null}

          {bio ? <p className="find-card__bio">"{bio}"</p> : null}
        </div>
      </div>
    </article>
  );
}
