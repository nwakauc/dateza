import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import {
  PLACE_SEARCH_MIN_CHARS,
  searchPlaces,
  type PlaceSearchHit,
} from "../../lib/api/places.ts";
import {
  confirmSavedLocation,
  updateProfileLocation,
  updateProfilePlace,
} from "../../lib/api/profile.ts";
import type { ProfileLocationStatus } from "../../lib/api/profileTypes.ts";

export const PLACE_SEARCH_DEBOUNCE_MS = 280;
export const LOCATION_PRIVACY_COPY =
  "We use your general area to show people nearby. Your exact location is never shown.";

type GpsPhase = "idle" | "locating" | "saving" | "denied" | "unavailable" | "timeout" | "unsupported" | "error";
type SearchPhase = "idle" | "loading" | "ready" | "error";

type Props = {
  savedLabel?: string | null;
  configuredWithoutPlace?: boolean;
  compact?: boolean;
  showPrivacyCopy?: boolean;
  onSaved: (status: ProfileLocationStatus) => void;
};

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
};

function gpsMessage(phase: GpsPhase, detail: string | undefined): string | undefined {
  switch (phase) {
    case "denied":
      return "Location access was denied. You can enter your area or suburb instead.";
    case "unavailable":
    case "timeout":
      return "We couldn't get your location. Try again or enter your area instead.";
    case "unsupported":
      return "This device can't share a location. Enter your area or suburb instead.";
    case "error":
      return detail ?? "Something went wrong saving your dating location. Try again.";
    default:
      return undefined;
  }
}

function placeSaveMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === "invalid_place") {
    return "That area isn't available. Choose a different dating area.";
  }
  if (error instanceof TypeError || (error instanceof DOMException && error.name === "TimeoutError")) {
    return "We couldn't reach DateZA. Check your connection and try again.";
  }
  return "We couldn't save your dating location. Try again.";
}

function gpsFieldMessage(error: unknown): string | undefined {
  if (error instanceof ApiError && error.details) {
    return Object.values(error.details).flat()[0];
  }
  if (error instanceof ApiError) return error.message;
  return undefined;
}

function resultSubtitle(hit: PlaceSearchHit): string | undefined {
  if (hit.displayPath === hit.name) return undefined;
  const prefix = `${hit.name}, `;
  return hit.displayPath.startsWith(prefix) ? hit.displayPath.slice(prefix.length) : hit.displayPath;
}

export function DatingLocationPicker({
  savedLabel,
  configuredWithoutPlace = false,
  compact = false,
  showPrivacyCopy = !compact,
  onSaved,
}: Props) {
  const inputId = useId();
  const listId = useId();
  const statusId = useId();
  const busyRef = useRef(false);
  const debounceRef = useRef<number | undefined>(undefined);
  const searchRequestRef = useRef(0);

  const [gpsPhase, setGpsPhase] = useState<GpsPhase>("idle");
  const [gpsDetail, setGpsDetail] = useState<string | undefined>();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<PlaceSearchHit[]>([]);
  const [searchPhase, setSearchPhase] = useState<SearchPhase>("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const [savingPlaceId, setSavingPlaceId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [confirmedLabel, setConfirmedLabel] = useState<string | null>(null);
  const [confirmedDeviceOnly, setConfirmedDeviceOnly] = useState(false);

  const gpsBusy = gpsPhase === "locating" || gpsPhase === "saving";
  const searchBusy = savingPlaceId !== null;
  const busy = gpsBusy || searchBusy;
  const displayedLabel = confirmedLabel ?? savedLabel ?? null;
  const usingCurrentArea = confirmedDeviceOnly || (configuredWithoutPlace && !confirmedLabel);
  const hasSaved = Boolean(displayedLabel) || usingCurrentArea;
  const gpsRetryable = gpsPhase === "denied" || gpsPhase === "unavailable" || gpsPhase === "timeout" || gpsPhase === "error";
  const listOpen = searchPhase === "ready" && hits.length > 0 && !searchBusy;
  const trimmedQuery = query.trim();

  function scheduleSearch(value: string) {
    window.clearTimeout(debounceRef.current);
    const needle = value.trim();
    const requestId = ++searchRequestRef.current;
    if (needle.length < PLACE_SEARCH_MIN_CHARS) {
      setHits([]);
      setSearchPhase("idle");
      setActiveIndex(0);
      return;
    }
    setSearchPhase("loading");
    debounceRef.current = window.setTimeout(() => {
      void searchPlaces(needle)
        .then((results) => {
          if (requestId !== searchRequestRef.current) return;
          setHits(results);
          setActiveIndex(0);
          setSearchPhase("ready");
        })
        .catch(() => {
          if (requestId !== searchRequestRef.current) return;
          setHits([]);
          setSearchPhase("error");
        });
    }, PLACE_SEARCH_DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      searchRequestRef.current += 1;
      window.clearTimeout(debounceRef.current);
    };
  }, []);

  function applyConfirmed(status: ProfileLocationStatus) {
    const label = status.place?.display_path ?? null;
    setConfirmedLabel(label);
    setConfirmedDeviceOnly(status.configured && !status.place);
    onSaved(status);
  }

  async function saveGps(coords: { latitude: number; longitude: number; accuracyMeters: number; capturedAt: string }) {
    setGpsPhase("saving");
    try {
      const written = await updateProfileLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy_meters: Math.round(coords.accuracyMeters),
        captured_at: coords.capturedAt,
      });
      if (!written.configured) {
        setGpsPhase("error");
        setGpsDetail("DateZA couldn't confirm your location yet. Try again.");
        return;
      }
      const status = await confirmSavedLocation(written);
      setGpsPhase("idle");
      applyConfirmed(status);
    } catch (caught) {
      setGpsPhase("error");
      setGpsDetail(gpsFieldMessage(caught) ?? "Something went wrong saving your dating location. Try again.");
    } finally {
      busyRef.current = false;
    }
  }

  function requestLocation() {
    if (busyRef.current || busy) return;
    if (!navigator.geolocation) {
      setGpsPhase("unsupported");
      return;
    }
    busyRef.current = true;
    setGpsPhase("locating");
    setGpsDetail(undefined);
    setSaveError(undefined);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void saveGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        });
      },
      (positionError) => {
        busyRef.current = false;
        if (positionError.code === positionError.PERMISSION_DENIED) {
          setGpsPhase("denied");
        } else if (positionError.code === positionError.TIMEOUT) {
          setGpsPhase("timeout");
        } else {
          setGpsPhase("unavailable");
        }
      },
      GEOLOCATION_OPTIONS,
    );
  }

  async function selectHit(hit: PlaceSearchHit) {
    if (busy) return;
    setSavingPlaceId(hit.id);
    setSaveError(undefined);
    try {
      const written = await updateProfilePlace(hit.id);
      if (!written.configured) {
        setSaveError("DateZA couldn't confirm that dating area. Try again.");
        return;
      }
      const status = await confirmSavedLocation(written);
      setQuery("");
      setHits([]);
      setSearchPhase("idle");
      applyConfirmed(status);
    } catch (error) {
      setSaveError(placeSaveMessage(error));
    } finally {
      setSavingPlaceId(null);
    }
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!listOpen) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      const hit = hits[activeIndex];
      if (hit) {
        event.preventDefault();
        void selectHit(hit);
      }
    } else if (event.key === "Escape") {
      setHits([]);
      setSearchPhase("idle");
    }
  }

  const gpsLabel = gpsBusy
    ? gpsPhase === "locating"
      ? "Finding you…"
      : "Saving…"
    : gpsRetryable
      ? "Try again"
      : hasSaved
        ? compact
          ? "Update using current location"
          : "Use my current location"
        : "Use my current location";

  const gpsCopy = gpsMessage(gpsPhase, gpsDetail);
  const activeHit = listOpen ? hits[activeIndex] : undefined;

  return (
    <div className={compact ? "dating-location dating-location--compact" : "dating-location"}>
      {displayedLabel ? (
        <p className="dating-location__saved" role="status">
          Dating from {displayedLabel}
        </p>
      ) : usingCurrentArea ? (
        <p className="dating-location__saved" role="status">
          Using your current area
        </p>
      ) : null}

      {showPrivacyCopy ? <p className="auth-form__hint">{LOCATION_PRIVACY_COPY}</p> : null}

      <div className="dating-location__option">
        <p className="dating-location__option-title">Use my current location</p>
        <p className="dating-location__support">Use this device to find your general dating area.</p>
        <button
          type="button"
          className={compact ? "dating-location__secondary" : "auth-form__submit"}
          onClick={requestLocation}
          disabled={busy || gpsPhase === "unsupported"}
        >
          {gpsLabel}
        </button>
      </div>

      {gpsCopy ? (
        <p className="auth-form__error" role="alert">
          {gpsCopy}
        </p>
      ) : null}

      <p className="dating-location__or" role="separator">
        or
      </p>

      <div className="dating-location__option">
        <p className="dating-location__option-title">
          {hasSaved ? "Change area or suburb" : "Enter my area or suburb"}
        </p>
        <div className="auth-field">
          <label htmlFor={inputId}>Search suburb, city or area</label>
          <input
            id={inputId}
            type="search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            disabled={busy}
            placeholder="Sea Point, Sandton, Midrand"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={listOpen}
            aria-controls={listId}
            aria-activedescendant={activeHit ? `${listId}-${activeHit.id}` : undefined}
            aria-describedby={statusId}
            onChange={(event) => {
              setQuery(event.target.value);
              setSaveError(undefined);
              scheduleSearch(event.target.value);
            }}
            onKeyDown={onSearchKeyDown}
          />
        </div>
        <p id={statusId} className="dating-location__search-status" aria-live="polite">
          {searchPhase === "loading" ? "Searching areas…" : null}
          {searchPhase === "error" ? "Area search is temporarily unavailable." : null}
          {searchPhase === "ready" && hits.length === 0 && trimmedQuery.length >= PLACE_SEARCH_MIN_CHARS
            ? "We couldn't find that area. Try a nearby suburb, town or city."
            : null}
        </p>
        {searchPhase === "error" ? (
          <button
            type="button"
            className="dating-location__retry"
            onClick={() => scheduleSearch(query)}
            disabled={busy}
          >
            Search again
          </button>
        ) : null}
        {listOpen ? (
          <ul id={listId} className="onboard-suburb-results" role="listbox" aria-label="Matching areas">
            {hits.map((hit, index) => {
              const subtitle = resultSubtitle(hit);
              const selected = index === activeIndex;
              return (
                <li key={hit.id} role="presentation">
                  <button
                    type="button"
                    id={`${listId}-${hit.id}`}
                    role="option"
                    aria-label={subtitle ? `${hit.name}, ${subtitle}` : hit.name}
                    className={
                      selected
                        ? "onboard-suburb-results__item onboard-suburb-results__item--active"
                        : "onboard-suburb-results__item"
                    }
                    disabled={busy}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => void selectHit(hit)}
                  >
                    <span className="dating-location__result-name">
                      {savingPlaceId === hit.id ? "Saving…" : hit.name}
                    </span>
                    {subtitle ? <span className="dating-location__result-path">{subtitle}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {saveError ? (
          <p className="auth-form__error" role="alert">
            {saveError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
