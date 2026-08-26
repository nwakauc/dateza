import type { DiscoveryProfile } from "../../lib/api/discoveryTypes.ts";
import { MapPinIcon, SlidersIcon, UserPlusIcon } from "../shell/icons.tsx";
import { customFilterCount, type DiscoverFilters } from "./discoverFilters.ts";

type Props = {
  profiles: DiscoveryProfile[];
  filters: DiscoverFilters;
  onToggleOnline: () => void;
  onToggleNearby: () => void;
  onToggleNewHere: () => void;
  onOpenFilters: () => void;
};

function FaceStack({ profiles }: { profiles: DiscoveryProfile[] }) {
  const shown = profiles.slice(0, 5);
  if (shown.length === 0) return null;
  const extra = profiles.length - shown.length;
  return (
    <div className="discover-facet__faces" aria-hidden="true">
      {shown.map((profile) =>
        profile.photos[0] ? (
          <img key={profile.id} src={profile.photos[0].url} alt="" />
        ) : (
          <span key={profile.id} />
        ),
      )}
      {extra > 0 ? <span className="discover-facet__more">+{extra}</span> : null}
    </div>
  );
}

export function DiscoverQuickFilters({
  profiles,
  filters,
  onToggleOnline,
  onToggleNearby,
  onToggleNewHere,
  onOpenFilters,
}: Props) {
  const online = profiles.filter((profile) => profile.online);
  const nearby = profiles.filter((profile) => profile.distance_km != null);
  const newHere = profiles.filter((profile) => profile.new_here);
  const custom = customFilterCount(filters);

  return (
    <div className="discover-facets" role="toolbar" aria-label="Discover shortcuts">
      <button
        type="button"
        className={`discover-facet${filters.online ? " discover-facet--active" : ""}`}
        aria-pressed={filters.online}
        onClick={onToggleOnline}
      >
        <span className="discover-facet__icon discover-facet__icon--online" aria-hidden="true" />
        <span className="discover-facet__copy">
          <strong>Online now</strong>
          <span>See who's online</span>
        </span>
        <FaceStack profiles={online} />
      </button>
      <button
        type="button"
        className={`discover-facet${filters.nearby ? " discover-facet--active" : ""}`}
        aria-pressed={filters.nearby}
        onClick={onToggleNearby}
      >
        <span className="discover-facet__icon discover-facet__icon--nearby">
          <MapPinIcon />
        </span>
        <span className="discover-facet__copy">
          <strong>Nearby</strong>
          <span>Close to you</span>
        </span>
        <FaceStack profiles={nearby} />
      </button>
      <button
        type="button"
        className={`discover-facet${filters.newHere ? " discover-facet--active" : ""}`}
        aria-pressed={filters.newHere}
        onClick={onToggleNewHere}
      >
        <span className="discover-facet__icon discover-facet__icon--new">
          <UserPlusIcon />
        </span>
        <span className="discover-facet__copy">
          <strong>New here</strong>
          <span>Recently joined</span>
        </span>
        <FaceStack profiles={newHere} />
      </button>
      <button type="button" className="discover-facet discover-facet--filters" onClick={onOpenFilters}>
        <span className="discover-facet__icon discover-facet__icon--filters">
          <SlidersIcon />
        </span>
        <span className="discover-facet__copy">
          <strong>{custom > 0 ? `Filters · ${custom}` : "More filters"}</strong>
          <span>Age, distance, lifestyle</span>
        </span>
      </button>
    </div>
  );
}
