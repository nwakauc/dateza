import type { FindProfile } from "../../lib/api/findTypes.ts";

type InteractionState = "idle" | "liked" | "matched" | "passed";

type Props = {
  profile: FindProfile;
  interaction: InteractionState;
  onOpen: () => void;
  onLike: () => void;
  onPass: () => void;
  pending: boolean;
};

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.6l6.4 2.3v5.3c0 4.3-2.7 7.3-6.4 9.2-3.7-1.9-6.4-4.9-6.4-9.2V5.9z" />
    </svg>
  );
}

export function ProfileCard({ profile, interaction, onOpen, onLike, onPass, pending }: Props) {
  const photo = profile.photos[0];
  const location = [profile.city, profile.country_code].filter(Boolean).join(", ");

  return (
    <article className="discover-card">
      <button className="discover-card__photo" type="button" onClick={onOpen} aria-label={`Open ${profile.display_name ?? "this profile"}'s profile`}>
        {photo ? (
          <img src={photo.url} alt="" loading="lazy" />
        ) : (
          <div className="discover-card__photo-placeholder" aria-hidden="true" />
        )}
        {profile.online ? <span className="discover-card__online" aria-label="Online now" /> : null}
        <div className="discover-card__scrim">
          {profile.verified || profile.compatibility ? (
            <div className="discover-card__badges">
              {profile.verified ? (
                <span className="discover-card__badge discover-card__badge--verified">
                  <ShieldIcon /> RealMe
                </span>
              ) : null}
              {profile.compatibility ? (
                <span className="discover-card__badge discover-card__badge--score">
                  <span className="discover-card__badge-dot" />
                  {profile.compatibility.score}% match
                </span>
              ) : null}
            </div>
          ) : null}
          <div className="discover-card__name-row">
            <span className="discover-card__display-name">{profile.display_name ?? "DateZA member"}</span>
            {profile.age ? <span className="discover-card__age">{profile.age}</span> : null}
          </div>
          {location ? <p className="discover-card__location">{location}</p> : null}
        </div>
      </button>
      <div className="discover-card__actions">
        <button
          className="discover-card__action discover-card__action--pass"
          type="button"
          onClick={onPass}
          disabled={pending || interaction === "passed"}
          aria-label="Pass"
        >
          {interaction === "passed" ? "Passed" : "Pass"}
        </button>
        <button
          className="discover-card__action discover-card__action--like"
          type="button"
          onClick={onLike}
          disabled={pending || interaction === "liked" || interaction === "matched"}
          aria-label="Like"
        >
          {interaction === "matched" ? "It's a match!" : interaction === "liked" ? "Liked" : "Like"}
        </button>
      </div>
    </article>
  );
}
