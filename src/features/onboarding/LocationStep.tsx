import { useRef, useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { geocodeSuburb, type GeocodeResult } from "../../lib/api/geocode.ts";
import { updateProfileLocation } from "../../lib/api/profile.ts";
import { markLocationConfirmed } from "../../lib/locationConfirmationStore.ts";
import { onboardingErrorMessage } from "./onboardingErrors.ts";

type Phase = "idle" | "locating" | "saving" | "denied" | "unavailable" | "timeout" | "unsupported" | "error";
type SearchPhase = "idle" | "searching" | "results" | "not-found" | "search-error";

type Props = {
  profileId: string;
  onSuccess: () => void;
};

// enableHighAccuracy asks for GPS-grade precision when available; a short
// maximumAge lets the browser reuse a very recent fix instead of always
// re-acquiring, keeping "useful accuracy without unreasonable delay".
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
};

// A typed suburb resolves to its centre point, not a device fix — this is a
// rough "how big is a suburb" radius, not a measured accuracy, so distance
// matching treats it as coarser than any real GPS/network fix.
const MANUAL_ACCURACY_METERS = 3_000;

function messageFor(phase: Phase, detail: string | undefined): string | undefined {
  switch (phase) {
    case "denied":
      return "DateZA needs your location to show you people nearby. Allow location for this site in your browser settings, then try again — or enter your suburb below instead.";
    case "unavailable":
      return "We couldn't work out your location. Try again in a moment, or enter your suburb below instead.";
    case "timeout":
      return "That took too long. Try again, or enter your suburb below instead.";
    case "unsupported":
      return "Your browser doesn't support location sharing, so we can't show you nearby matches yet. Enter your suburb below instead.";
    case "error":
      return detail ?? "Something went wrong saving your location. Try again.";
    default:
      return undefined;
  }
}

export function LocationStep({ profileId, onSuccess }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [detail, setDetail] = useState<string | undefined>();
  const busyRef = useRef(false);

  const [manualOpen, setManualOpen] = useState(false);
  const [suburbQuery, setSuburbQuery] = useState("");
  const [searchPhase, setSearchPhase] = useState<SearchPhase>("idle");
  const [results, setResults] = useState<GeocodeResult[]>([]);

  const busy = phase === "locating" || phase === "saving";
  const retryable = phase === "denied" || phase === "unavailable" || phase === "timeout" || phase === "error";

  async function save(coords: { latitude: number; longitude: number; accuracyMeters: number; capturedAt: string }) {
    setPhase("saving");
    try {
      const status = await updateProfileLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy_meters: Math.round(coords.accuracyMeters),
        captured_at: coords.capturedAt,
      });
      if (!status.configured) {
        setPhase("error");
        setDetail("DateZA couldn't confirm your location yet. Try again.");
        return;
      }
      markLocationConfirmed(profileId);
      onSuccess();
    } catch (caught) {
      const fieldMessage = caught instanceof ApiError && caught.details ? Object.values(caught.details).flat()[0] : undefined;
      setPhase("error");
      setDetail(fieldMessage ?? onboardingErrorMessage(caught));
    } finally {
      busyRef.current = false;
    }
  }

  function requestLocation() {
    if (busyRef.current) {
      return;
    }
    if (!navigator.geolocation) {
      setPhase("unsupported");
      return;
    }
    busyRef.current = true;
    setPhase("locating");
    setDetail(undefined);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void save({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        });
      },
      (positionError) => {
        busyRef.current = false;
        if (positionError.code === positionError.PERMISSION_DENIED) {
          setPhase("denied");
        } else if (positionError.code === positionError.TIMEOUT) {
          setPhase("timeout");
        } else {
          setPhase("unavailable");
        }
      },
      GEOLOCATION_OPTIONS,
    );
  }

  async function searchSuburb(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchPhase === "searching" || busy) {
      return;
    }
    setSearchPhase("searching");
    setResults([]);
    try {
      const found = await geocodeSuburb(suburbQuery);
      setResults(found);
      setSearchPhase(found.length > 0 ? "results" : "not-found");
    } catch {
      setSearchPhase("search-error");
    }
  }

  function chooseResult(result: GeocodeResult) {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    void save({
      latitude: result.latitude,
      longitude: result.longitude,
      accuracyMeters: MANUAL_ACCURACY_METERS,
      capturedAt: new Date().toISOString(),
    });
  }

  const message = messageFor(phase, detail);

  return (
    <div className="auth-form">
      {message ? (
        <p className="auth-form__error" role="alert">
          {message}
        </p>
      ) : null}
      <p className="auth-form__hint">
        DateZA never shows other members your exact location — only the distance between you.
      </p>
      <div className="onboard-actions">
        <button
          type="button"
          className="auth-form__submit"
          onClick={requestLocation}
          disabled={busy || phase === "unsupported"}
        >
          {phase === "locating"
            ? "Finding you…"
            : phase === "saving" && !manualOpen
              ? "Saving…"
              : retryable
                ? "Try again"
                : "Use my current location"}
        </button>
      </div>

      {!manualOpen ? (
        <button
          type="button"
          className="shell-text-action onboard-manual-location__toggle"
          onClick={() => setManualOpen(true)}
          disabled={busy}
        >
          Can't share your location? Enter your suburb instead
        </button>
      ) : (
        <div className="onboard-manual-location">
          <form
            className="auth-field"
            onSubmit={(event) => void searchSuburb(event)}
          >
            <label htmlFor="onboard-suburb">Suburb or area</label>
            <input
              id="onboard-suburb"
              type="text"
              value={suburbQuery}
              onChange={(event) => setSuburbQuery(event.target.value)}
              placeholder="e.g. Sandton, Gauteng"
              disabled={busy}
              autoComplete="off"
            />
            <button
              type="submit"
              className="onboard-manual-location__submit"
              disabled={busy || searchPhase === "searching" || suburbQuery.trim().length < 2}
            >
              {searchPhase === "searching" ? "Searching…" : "Find"}
            </button>
          </form>

          {searchPhase === "not-found" ? (
            <p className="auth-form__hint" role="alert">
              We couldn't find that. Try a different spelling or a nearby suburb.
            </p>
          ) : null}
          {searchPhase === "search-error" ? (
            <p className="auth-form__hint" role="alert">
              We couldn't search right now. Try again in a moment.
            </p>
          ) : null}

          {searchPhase === "results" && results.length > 0 ? (
            <ul className="onboard-suburb-results" aria-label="Matching suburbs">
              {results.map((result) => (
                <li key={`${result.latitude},${result.longitude}`}>
                  <button
                    type="button"
                    className="onboard-suburb-results__item"
                    onClick={() => chooseResult(result)}
                    disabled={busy}
                  >
                    {phase === "saving" ? "Saving…" : result.displayName}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
