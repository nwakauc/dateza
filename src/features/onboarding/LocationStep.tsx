import { useRef, useState } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { updateProfileLocation } from "../../lib/api/profile.ts";
import { DatingPlacePicker } from "../profile/edit/DatingPlacePicker.tsx";
import { onboardingErrorMessage } from "./onboardingErrors.ts";

type Phase = "idle" | "locating" | "saving" | "denied" | "unavailable" | "timeout" | "unsupported" | "error";

type Props = {
  onSuccess: () => void;
};

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
};

function messageFor(phase: Phase, detail: string | undefined): string | undefined {
  switch (phase) {
    case "denied":
      return "DateZA needs a dating location to show people nearby. Allow location for this site, then try again — or choose a general area above.";
    case "unavailable":
      return "We couldn't work out your location. Try again in a moment, or choose a general area above.";
    case "timeout":
      return "That took too long. Try again, or choose a general area above.";
    case "unsupported":
      return "This browser can't share a device location. Choose a general area above instead.";
    case "error":
      return detail ?? "Something went wrong saving your dating location. Try again.";
    default:
      return undefined;
  }
}

export function LocationStep({ onSuccess }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [detail, setDetail] = useState<string | undefined>();
  const busyRef = useRef(false);

  const gpsBusy = phase === "locating" || phase === "saving";
  const retryable = phase === "denied" || phase === "unavailable" || phase === "timeout" || phase === "error";

  async function saveGps(coords: { latitude: number; longitude: number; accuracyMeters: number; capturedAt: string }) {
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

  const message = messageFor(phase, detail);

  return (
    <div className="auth-form">
      <p className="auth-form__hint">Choose the general area you want to date from.</p>
      <DatingPlacePicker disabled={gpsBusy} onSaved={() => onSuccess()} />

      {message ? (
        <p className="auth-form__error" role="alert">
          {message}
        </p>
      ) : null}

      <div className="onboard-manual-location">
        <p className="place-picker__gps-label">Prefer to use this device instead?</p>
        <div className="onboard-actions">
          <button
            type="button"
            className="auth-form__submit"
            onClick={requestLocation}
            disabled={gpsBusy || phase === "unsupported"}
          >
            {phase === "locating"
              ? "Finding you…"
              : phase === "saving"
                ? "Saving…"
                : retryable
                  ? "Try again"
                  : "Use my current location"}
          </button>
        </div>
      </div>
    </div>
  );
}
