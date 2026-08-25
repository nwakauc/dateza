import { useRef, useState } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { updateProfileLocation } from "../../lib/api/profile.ts";
import { markLocationConfirmed } from "../../lib/locationConfirmationStore.ts";
import { onboardingErrorMessage } from "./onboardingErrors.ts";

type Phase = "idle" | "locating" | "saving" | "denied" | "unavailable" | "timeout" | "unsupported" | "error";

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

function messageFor(phase: Phase, detail: string | undefined): string | undefined {
  switch (phase) {
    case "denied":
      return "DateZA needs your location to show you people nearby. Allow location for this site in your browser settings, then try again.";
    case "unavailable":
      return "We couldn't work out your location. Try again in a moment.";
    case "timeout":
      return "That took too long. Try again.";
    case "unsupported":
      return "Your browser doesn't support location sharing, so we can't show you nearby matches yet. Try DateZA on a different browser or device.";
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

  const busy = phase === "locating" || phase === "saving";
  const retryable = phase === "denied" || phase === "unavailable" || phase === "timeout" || phase === "error";

  async function save(position: GeolocationPosition) {
    setPhase("saving");
    try {
      const status = await updateProfileLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy_meters: Math.round(position.coords.accuracy),
        captured_at: new Date(position.timestamp).toISOString(),
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
        void save(position);
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
            : phase === "saving"
              ? "Saving…"
              : retryable
                ? "Try again"
                : "Use my current location"}
        </button>
      </div>
    </div>
  );
}
