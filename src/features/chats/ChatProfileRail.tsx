import { Link } from "react-router-dom";
import type { DatezaCompatibility, ProfileDetail } from "../../lib/api/findTypes.ts";
import { describeCompatibilityReasons } from "../discovery/compatibilityCopy.ts";
import { ProfileSafetyActions } from "../profile/ProfileSafetyActions.tsx";
import { MapPinIcon, ShieldCheckIcon } from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";

type Props = {
  profile?: ProfileDetail;
  loading: boolean;
  error: boolean;
  returnTo: string;
  onRetry: () => void;
  onBlocked: () => void;
};

function CompatibilitySummary({ compatibility }: { compatibility: NonNullable<DatezaCompatibility> }) {
  const reasons = describeCompatibilityReasons(compatibility.reasons, compatibility.version).slice(0, 3);
  return (
    <section className="chat-rail__section chat-rail__compat">
      <p>Our compatibility</p>
      <strong>{compatibility.score}%</strong>
      {reasons.length > 0 ? (
        <ul>{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
      ) : null}
    </section>
  );
}

export function ChatProfileRail({ profile, loading, error, returnTo, onRetry, onBlocked }: Props) {
  if (loading) {
    return (
      <aside className="chat-rail chat-rail--loading" aria-label="Loading profile context" aria-busy="true">
        <div className="chat-rail__photo" />
        <span /><span /><span />
      </aside>
    );
  }

  if (error || !profile) {
    return (
      <aside className="chat-rail chat-rail--error" aria-label="Profile context unavailable">
        <h2>About this connection</h2>
        <p>Profile details didn’t load. Your conversation is still available.</p>
        <button type="button" onClick={onRetry}>Try profile again</button>
      </aside>
    );
  }

  const name = profile.display_name ?? "DateZA member";
  const photo = profile.photos[0];
  const place = [profile.city, profile.country_code].filter(Boolean).join(", ");
  const interests = profile.interests.slice(0, 5);

  return (
    <aside className="chat-rail" aria-label={`About ${name}`}>
      <div className="chat-rail__top">
        <h2>About {name.split(" ")[0] || name}</h2>
        <ProfileSafetyActions profileId={profile.id} name={name} onBlocked={onBlocked} />
      </div>
      {photo ? <img className="chat-rail__photo" src={photo.url} width="320" height="360" alt="" /> : null}
      <div className="chat-rail__identity">
        <h3>
          {name}{profile.age ? `, ${profile.age}` : ""}
          {profile.verified ? <span title={VERIFIED_CONTACT_LABEL}><ShieldCheckIcon /></span> : null}
        </h3>
        {place ? <p><MapPinIcon />{place}{profile.distance_km != null ? ` · ${Math.round(profile.distance_km)} km away` : ""}</p> : null}
        {profile.online ? <span className="chat-rail__presence">Online now</span> : profile.active_today ? <span>Active today</span> : null}
      </div>

      {profile.compatibility ? <CompatibilitySummary compatibility={profile.compatibility} /> : null}

      {interests.length > 0 ? (
        <section className="chat-rail__section">
          <h3>Interests</h3>
          <div className="chat-rail__interests">
            {interests.map((interest) => <span key={interest.slug}>{interest.label}</span>)}
          </div>
        </section>
      ) : null}

      {profile.looking_for_text ? (
        <section className="chat-rail__section">
          <h3>Looking for</h3>
          <p>{profile.looking_for_text}</p>
        </section>
      ) : null}

      <Link className="chat-rail__profile-link" to={`/profile/${profile.id}`} state={{ from: "chats", returnTo }}>
        View full profile
      </Link>
    </aside>
  );
}
