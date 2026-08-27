import { useEffect, useId, useRef, useState } from "react";
import { ApiError } from "../../../lib/api/errors.ts";
import { listPlaces } from "../../../lib/api/places.ts";
import { updateProfilePlace } from "../../../lib/api/profile.ts";
import type { Place } from "../../../lib/api/placesTypes.ts";
import type { ProfileLocationStatus } from "../../../lib/api/profileTypes.ts";

type LoadPhase = "loading" | "ready" | "error";

type Props = {
  /** Human-readable area from GET /profile or the last successful PUT. */
  savedLabel?: string | null;
  /** Server says location is configured but has no Place to name (GPS-only). */
  configuredWithoutPlace?: boolean;
  disabled?: boolean;
  onSaved: (status: ProfileLocationStatus) => void;
};

function placeSaveMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === "invalid_place") {
    return "That area isn't available. Choose a different dating area.";
  }
  if (error instanceof TypeError || (error instanceof DOMException && error.name === "TimeoutError")) {
    return "We couldn't reach DateZA. Check your connection and try again.";
  }
  return "We couldn't save your dating location. Try again.";
}

export function DatingPlacePicker({
  savedLabel,
  configuredWithoutPlace = false,
  disabled = false,
  onSaved,
}: Props) {
  const headingId = useId();
  const loadErrorId = useId();
  const saveErrorId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigatedRef = useRef(false);

  const [parent, setParent] = useState<Place | null>(null);
  const [ancestors, setAncestors] = useState<Place[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadPhase, setLoadPhase] = useState<LoadPhase>("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const [savingPlaceId, setSavingPlaceId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [confirmedLabel, setConfirmedLabel] = useState<string | null>(null);

  const parentId = parent?.id;
  const saving = savingPlaceId !== null;
  const busy = disabled || saving;
  const displayedLabel = confirmedLabel ?? savedLabel ?? null;

  useEffect(() => {
    let cancelled = false;
    void listPlaces(parentId)
      .then((items) => {
        if (cancelled) return;
        setPlaces(items);
        setLoadPhase("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setPlaces([]);
        setLoadPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [parentId, reloadToken]);

  useEffect(() => {
    if (!navigatedRef.current) return;
    headingRef.current?.focus();
  }, [parentId, loadPhase]);

  function openPlace(place: Place) {
    navigatedRef.current = true;
    setSaveError(undefined);
    setLoadPhase("loading");
    setPlaces([]);
    setAncestors((current) => (parent ? [...current, parent] : current));
    setParent(place);
  }

  function goBack() {
    navigatedRef.current = true;
    setSaveError(undefined);
    setLoadPhase("loading");
    setPlaces([]);
    const previous = ancestors[ancestors.length - 1];
    setAncestors((current) => current.slice(0, -1));
    setParent(previous ?? null);
  }

  async function savePlace(place: Place) {
    if (busy) return;
    setSavingPlaceId(place.id);
    setSaveError(undefined);
    try {
      const status = await updateProfilePlace(place.id);
      if (!status.configured) {
        setSaveError("DateZA couldn't confirm that dating area. Try again.");
        return;
      }
      const label = status.place?.display_path ?? place.name;
      setConfirmedLabel(label);
      onSaved(status);
    } catch (error) {
      setSaveError(placeSaveMessage(error));
    } finally {
      setSavingPlaceId(null);
    }
  }

  const levelTitle = parent ? `Areas in ${parent.name}` : "Choose a province or region";

  return (
    <div className="place-picker">
      {displayedLabel ? (
        <p className="place-picker__saved" role="status">
          Dating from {displayedLabel}
        </p>
      ) : configuredWithoutPlace ? (
        <p className="place-picker__saved" role="status">
          Your dating area is set. Choose a general area below to change it.
        </p>
      ) : null}

      <div className="place-picker__nav">
        {parent ? (
          <button type="button" className="place-picker__back" onClick={goBack} disabled={busy}>
            {ancestors.length > 0 ? `Back to ${ancestors[ancestors.length - 1]?.name}` : "Back to provinces"}
          </button>
        ) : null}
        <h2 ref={headingRef} id={headingId} className="place-picker__heading" tabIndex={-1}>
          {levelTitle}
        </h2>
      </div>

      {parent ? (
        <button
          type="button"
          className="place-picker__choose-parent"
          onClick={() => void savePlace(parent)}
          disabled={busy}
        >
          {savingPlaceId === parent.id ? "Saving…" : `Use ${parent.name}`}
        </button>
      ) : null}

      {loadPhase === "loading" ? (
        <p className="place-picker__hint" aria-live="polite">
          Loading dating areas…
        </p>
      ) : null}

      {loadPhase === "error" ? (
        <div className="place-picker__error-block">
          <p id={loadErrorId} className="auth-form__error" role="alert">
            We couldn't load dating areas. Try again.
          </p>
          <button
            type="button"
            className="place-picker__retry"
            onClick={() => {
              navigatedRef.current = true;
              setSaveError(undefined);
              setLoadPhase("loading");
              setReloadToken((token) => token + 1);
            }}
            disabled={busy}
          >
            Try again
          </button>
        </div>
      ) : null}

      {saveError ? (
        <p id={saveErrorId} className="auth-form__error" role="alert">
          {saveError}
        </p>
      ) : null}

      {loadPhase === "ready" && places.length === 0 && parent === null ? (
        <p className="place-picker__hint">No dating areas are available right now.</p>
      ) : null}

      {loadPhase === "ready" && places.length > 0 ? (
        <ul className="place-picker__list" aria-labelledby={headingId}>
          {places.map((place) => (
            <li key={place.id} className="place-picker__item">
              {place.has_children ? (
                <>
                  <button
                    type="button"
                    className="place-picker__open"
                    onClick={() => openPlace(place)}
                    disabled={busy}
                  >
                    {place.name}
                  </button>
                  <button
                    type="button"
                    className="place-picker__use"
                    onClick={() => void savePlace(place)}
                    disabled={busy}
                    aria-label={
                      savingPlaceId === place.id
                        ? `Saving ${place.name}`
                        : `Use ${place.name} as dating location`
                    }
                  >
                    {savingPlaceId === place.id ? "Saving…" : "Use"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="place-picker__open place-picker__open--leaf"
                  onClick={() => void savePlace(place)}
                  disabled={busy}
                  aria-describedby={saveError ? saveErrorId : undefined}
                >
                  {savingPlaceId === place.id ? "Saving…" : `Use ${place.name}`}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="auth-form__hint">
        Choose the general area you want to date from. Other members never see a pin.
      </p>
    </div>
  );
}
