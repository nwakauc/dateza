import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDiscoveryProfiles } from "../../lib/api/discovery.ts";
import { likeProfile } from "../../lib/api/find.ts";
import { getProfileConfiguration } from "../../lib/api/profile.ts";
import { listOwnerPhotos } from "../../lib/api/photos.ts";
import { ApiError } from "../../lib/api/errors.ts";
import type { DiscoveryProfile, DiscoverySelection } from "../../lib/api/discoveryTypes.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { Modal } from "../verification/Modal.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { useVerificationGate } from "../verification/useVerificationGate.ts";
import { CompassIcon, SlidersIcon } from "../shell/icons.tsx";
import { MatchModal } from "../shell/MatchModal.tsx";
import { buildOptionLabelLookup } from "../find/optionLabels.ts";
import { ProfileStandOutPrompt } from "../profile/ProfileStandOutPrompt.tsx";
import { DiscoveryCard } from "./DiscoveryCard.tsx";
import { DiscoverDailyPicks, DiscoverEmptySelection, DiscoverFilteredEmpty } from "./DiscoverDailyPicks.tsx";
import { DiscoverFilterSheet } from "./DiscoverFilterSheet.tsx";
import { DiscoverMatchModule } from "./DiscoverMatchModule.tsx";
import { DiscoverQuickFilters } from "./DiscoverQuickFilters.tsx";
import { DiscoverRecentlyActive } from "./DiscoverRecentlyActive.tsx";
import {
  EMPTY_DISCOVER_FILTERS,
  applyDiscoverFilters,
  hasDiscoverFilters,
  toggleQuickFilter,
  type DiscoverFilters,
} from "./discoverFilters.ts";
import { loadDiscoverFilters, loadDiscoverScroll, saveDiscoverFilters, saveDiscoverScroll } from "./discoverFilterMemory.ts";

type Interaction = "idle" | "liked" | "matched" | "passed";
type ActiveMatch = { profile: DiscoveryProfile; matchId: string | null };

const PHOTO_REFRESH_BUFFER_MS = 20_000;

/**
 * Discovery is DateZA's curated, recommendation-led surface (10/day) — a
 * separate product and allowance from Find, backed by `GET /api/v1/discovery`.
 * It must never call `/api/v1/find` or otherwise borrow Find's allowance
 * semantics. Filters only reshape the current daily batch.
 */
export default function DiscoveryPage() {
  const navigate = useNavigate();
  const { pendingReason, requireVerified, dismiss } = useVerificationGate();

  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [selection, setSelection] = useState<DiscoverySelection | undefined>();
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [interactions, setInteractions] = useState<Record<string, Interaction>>({});
  const [busyProfileId, setBusyProfileId] = useState<string | undefined>();
  const [attempt, setAttempt] = useState(0);
  const [activeMatch, setActiveMatch] = useState<ActiveMatch | undefined>();
  const [railMatch, setRailMatch] = useState<ActiveMatch | undefined>();
  const [filters, setFilters] = useState<DiscoverFilters>(loadDiscoverFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selfPhotoUrl, setSelfPhotoUrl] = useState<string | undefined>();

  useEffect(() => {
    document.title = "Discover — DateZA";
    let cancelled = false;
    getDiscoveryProfiles()
      .then((result) => {
        if (cancelled) return;
        setProfiles(result.profiles);
        setSelection(result.selection);
        setInteractions({});
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(discoveryErrorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    getProfileConfiguration()
      .then((result) => {
        if (!cancelled) setConfiguration(result.configuration);
      })
      .catch(() => undefined);
    listOwnerPhotos()
      .then((photos) => {
        if (!cancelled) setSelfPhotoUrl(photos[0]?.image?.url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [attempt]);

  useEffect(() => {
    saveDiscoverFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (loading) return;
    const offset = loadDiscoverScroll();
    if (offset > 0) window.scrollTo(0, offset);
  }, [loading]);

  useEffect(() => {
    return () => saveDiscoverScroll(window.scrollY);
  }, []);

  useEffect(() => {
    if (profiles.length === 0) return;
    const expiries = profiles.flatMap((profile) => (profile.photos[0] ? [profile.photos[0].url_expires_in] : []));
    if (expiries.length === 0) return;
    const soonest = Math.min(...expiries);
    if (!Number.isFinite(soonest) || soonest <= 0) return;
    const wait = Math.max(5_000, soonest * 1000 - PHOTO_REFRESH_BUFFER_MS);
    const timer = window.setTimeout(() => {
      getDiscoveryProfiles()
        .then((result) => {
          setProfiles(result.profiles);
          setSelection(result.selection);
        })
        .catch(() => undefined);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [profiles]);

  const visible = useMemo(() => applyDiscoverFilters(profiles, filters), [profiles, filters]);
  const optionLabel = useMemo(() => buildOptionLabelLookup(configuration), [configuration]);
  const filteredEmpty = profiles.length > 0 && visible.length === 0;

  function openProfile(profileId: string) {
    saveDiscoverScroll(window.scrollY);
    const compatibility = profiles.find((candidate) => candidate.id === profileId)?.compatibility ?? null;
    requireVerified("profile", () => navigate(`/profile/${profileId}`, { state: { from: "discover", compatibility } }));
  }

  function like(profileId: string) {
    requireVerified("like", () => {
      setBusyProfileId(profileId);
      likeProfile(profileId)
        .then((result) => {
          setInteractions((current) => ({ ...current, [profileId]: result.matched ? "matched" : "liked" }));
          if (result.matched) {
            const profile = profiles.find((candidate) => candidate.id === profileId);
            if (profile) {
              const match = { profile, matchId: result.match_id };
              setActiveMatch(match);
              setRailMatch(match);
            }
          }
        })
        .catch(() => undefined)
        .finally(() => setBusyProfileId(undefined));
    });
  }

  function retry() {
    setLoading(true);
    setError(undefined);
    setAttempt((current) => current + 1);
  }

  function clearFilters() {
    setFilters(EMPTY_DISCOVER_FILTERS);
  }

  const header = (
    <div className="discover-heading">
      <div>
        <h1 className="shell-page__title discover-heading__title">Discover</h1>
        <p className="shell-page__subtitle">Curated for you. Real people. Better dates.</p>
      </div>
      <button type="button" className="discover-heading__filter" onClick={() => setFilterOpen(true)}>
        <SlidersIcon />
        Filter
      </button>
    </div>
  );

  const verificationModal = pendingReason ? (
    <Modal ariaLabel="Verify your account" onClose={dismiss}>
      <VerificationFlow onDone={dismiss} />
    </Modal>
  ) : null;

  const completion = <ProfileStandOutPrompt />;

  const refreshTime = formatRefreshTime(selection?.refreshes_at);

  const matchModule = railMatch ? (
    <div className="discover-match-slot">
      <DiscoverMatchModule
        name={railMatch.profile.display_name ?? "them"}
        photoUrl={railMatch.profile.photos[0]?.url}
        selfPhotoUrl={selfPhotoUrl}
        matchId={railMatch.matchId}
        onKeepDiscovering={() => setRailMatch(undefined)}
      />
    </div>
  ) : null;

  const rail = (
    <aside className="discover-rail" aria-label="Discover extras">
      {selection ? <DiscoverDailyPicks selection={selection} refreshTime={refreshTime} /> : null}
      <DiscoverRecentlyActive profiles={profiles} onOpen={openProfile} />
      {completion}
    </aside>
  );

  if (loading) {
    return (
      <div className="shell-page discover-page">
        {header}
        <div className="discover-stage">
          <div className="discover-main">
            <div className="discover-facets discover-facets--skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="discovery-grid" aria-hidden="true">
              <span className="discovery-card-skeleton" />
              <span className="discovery-card-skeleton" />
              <span className="discovery-card-skeleton" />
              <span className="discovery-card-skeleton" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell-page discover-page">
        {header}
        <div className="shell-empty">
          <CompassIcon className="shell-empty__icon" />
          <p className="shell-empty__title">We couldn't load your picks</p>
          <p className="shell-empty__body">{error}</p>
          <button className="shell-primary-action" type="button" onClick={retry}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="shell-page discover-page">
        {header}
        <DiscoverEmptySelection refreshTime={refreshTime} />
        {completion}
        {verificationModal}
      </div>
    );
  }

  return (
    <div className="shell-page discover-page">
      <div className={`discover-stage${railMatch ? " discover-stage--matched" : ""}`}>
        <div className="discover-main">
          {header}
          <DiscoverQuickFilters
            profiles={profiles}
            filters={filters}
            onToggleOnline={() => setFilters((current) => toggleQuickFilter(current, "online"))}
            onToggleNearby={() => setFilters((current) => toggleQuickFilter(current, "nearby"))}
            onToggleNewHere={() => setFilters((current) => toggleQuickFilter(current, "newHere"))}
            onOpenFilters={() => setFilterOpen(true)}
          />
          {hasDiscoverFilters(filters) ? (
            <div className="discover-active-bar">
              <p>{filteredEmpty ? "No matches in today's picks" : `${visible.length} in today's picks`}</p>
              <button type="button" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          ) : null}
          {filteredEmpty ? (
            <DiscoverFilteredEmpty onClear={clearFilters} />
          ) : (
            <div className="discovery-grid" id="discover-grid">
              {visible.map((profile, index) => (
                <DiscoveryCard
                  key={profile.id}
                  profile={profile}
                  interaction={interactions[profile.id] ?? "idle"}
                  pending={busyProfileId === profile.id}
                  optionLabel={optionLabel}
                  eagerPhoto={index < 4}
                  onOpen={() => openProfile(profile.id)}
                  onLike={() => like(profile.id)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="discover-sidebar">
          {matchModule}
          {rail}
        </div>
      </div>
      <DiscoverFilterSheet
        open={filterOpen}
        filters={filters}
        configuration={configuration}
        onChange={setFilters}
        onClose={() => setFilterOpen(false)}
      />
      {verificationModal}
      {activeMatch ? (
        <MatchModal
          name={activeMatch.profile.display_name ?? "them"}
          photoUrl={activeMatch.profile.photos[0]?.url}
          matchId={activeMatch.matchId}
          continueLabel="Keep discovering"
          onContinue={() => setActiveMatch(undefined)}
        />
      ) : null}
    </div>
  );
}

function discoveryErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "Publish your profile to start seeing your picks.";
    }
    if (error.status === 404) {
      return "Discover isn't available for DateZA yet.";
    }
    if (error.status === 429) {
      return "Too many requests. Wait a moment and try again.";
    }
  }
  return "We could not load Discover. Try again.";
}

function formatRefreshTime(refreshesAt: string | undefined): string | undefined {
  if (!refreshesAt) {
    return undefined;
  }
  const date = new Date(refreshesAt);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });
}
