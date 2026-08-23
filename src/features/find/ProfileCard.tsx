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

export function ProfileCard({ profile, interaction, onOpen, onLike, onPass, pending }: Props) {
  const photo = profile.photos[0];
  const location = [profile.city, profile.country_code].filter(Boolean).join(", ");

  // At most two trust/match signals, shown together on one line rather than
  // as a wall of separate badges — see product spec item 6.
  const signals: string[] = [];
  if (profile.compatibility) {
    signals.push(`${profile.compatibility.score}% match`);
  }
  if (profile.verified) {
    signals.push("Verified");
  }

  return (
    <article className="discover-card">
      <button className="discover-card__photo" type="button" onClick={onOpen} aria-label={`Open ${profile.display_name ?? "this profile"}'s profile`}>
        {photo ? (
          <img src={photo.url} alt="" loading="lazy" />
        ) : (
          <div className="discover-card__photo-placeholder" aria-hidden="true" />
        )}
        {profile.online ? <span className="discover-card__online" aria-label="Online now" /> : null}
      </button>
      <div className="discover-card__body">
        <button className="discover-card__name" type="button" onClick={onOpen}>
          <span className="discover-card__display-name">{profile.display_name ?? "DateZA member"}</span>
          {profile.age ? <span className="discover-card__age">{profile.age}</span> : null}
        </button>
        {location ? <p className="discover-card__location">{location}</p> : null}
        {signals.length > 0 ? <p className="discover-card__compatibility">{signals.join(" · ")}</p> : null}
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
      </div>
    </article>
  );
}
