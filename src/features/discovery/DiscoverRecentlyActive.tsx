import type { DiscoveryProfile } from "../../lib/api/discoveryTypes.ts";

type Props = {
  profiles: DiscoveryProfile[];
  onOpen: (profileId: string) => void;
};

/**
 * Recently active among *today's Discover selection* using D8N `active_today`.
 * Does not invent people outside the batch or infer activity from timestamps.
 */
export function DiscoverRecentlyActive({ profiles, onOpen }: Props) {
  const active = profiles.filter((profile) => profile.active_today);
  if (active.length === 0) return null;

  return (
    <section className="discover-rail-card" aria-label="Recently active">
      <h2 className="discover-rail-card__title">Recently active</h2>
      <p className="discover-rail-card__body">From today's picks, active today.</p>
      <ul className="discover-active">
        {active.slice(0, 8).map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              onClick={() => onOpen(profile.id)}
              aria-label={`${profile.display_name ?? "Member"}, recently active`}
            >
              {profile.photos[0] ? <img src={profile.photos[0].url} alt="" /> : <span />}
              {profile.online ? <i className="discover-active__dot" /> : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
