import { useEffect, useId, useRef, useState } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { deleteOwnerPhoto, listOwnerPhotos } from "../../lib/api/photos.ts";
import {
  photoErrorMessage as sharedPhotoErrorMessage,
  uploadAndAttachPhoto,
  type PhotoUploadPhase,
} from "../profile/photoActions.ts";
import type { OwnerPhoto } from "../../lib/api/photoTypes.ts";
import type { ConfiguredCollection, ProfileOnboardingStatus } from "../../lib/api/profileTypes.ts";
import { onboardingErrorMessage } from "./onboardingErrors.ts";

type Slot =
  | { kind: "photo"; photo: OwnerPhoto }
  | {
      kind: "local";
      previewUrl: string;
      progress: "uploading" | "failed";
      phase: PhotoUploadPhase;
      percent: number;
      message?: string;
    }
  | { kind: "add" };

type Props = {
  collection?: ConfiguredCollection;
  onboarding: ProfileOnboardingStatus;
  onReconcile: () => Promise<void>;
  onContinue: () => void;
  pending: boolean;
  error?: string;
};

const PROCESSING_POLL_MS = 1_200;
const PROCESSING_NOTICE_MS = 45_000;

function awaitingDerivative(photo: OwnerPhoto): boolean {
  return photo.processing_state === "pending" || photo.processing_state === "processing";
}

function hasReadyDerivative(photo: OwnerPhoto): boolean {
  return photo.processing_state === "ready";
}

function photoErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "Photos aren’t available right now. Try again in a moment.";
    }
    if (error.code) {
      return sharedPhotoErrorMessage(error);
    }
  }
  return onboardingErrorMessage(error);
}

/** Says what is happening without naming any of the machinery doing it. */
const PHASE_LABEL: Record<PhotoUploadPhase, string> = {
  preparing: "Getting your photo ready…",
  uploading: "Uploading…",
  finishing: "Almost there…",
};

export function PhotosStep({
  collection,
  onboarding,
  onReconcile,
  onContinue,
  pending,
  error,
}: Props) {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceIdRef = useRef<number | undefined>(undefined);
  const busyRef = useRef(false);
  const [photos, setPhotos] = useState<OwnerPhoto[]>([]);
  const [localPreview, setLocalPreview] = useState<string | undefined>();
  const [localState, setLocalState] = useState<"uploading" | "failed" | undefined>();
  const [localMessage, setLocalMessage] = useState<string | undefined>();
  const [phase, setPhase] = useState<PhotoUploadPhase>("preparing");
  const [percent, setPercent] = useState(0);
  // Kept so "Try again" can resend the photo the member already chose rather
  // than sending them back to the picker to find it a second time.
  const lastFileRef = useRef<File | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const onReconcileRef = useRef(onReconcile);

  useEffect(() => {
    onReconcileRef.current = onReconcile;
  }, [onReconcile]);

  const photosMissing = onboarding.completion.missing.includes("photos");
  const preparing = photos.some(awaitingDerivative);
  const canContinue = !photosMissing && photos.some(hasReadyDerivative);
  const shouldPoll = preparing || (photosMissing && photos.some(hasReadyDerivative));
  const shouldPollRef = useRef(shouldPoll);

  useEffect(() => {
    let cancelled = false;
    void listOwnerPhotos()
      .then((items) => {
        if (!cancelled) {
          setPhotos(items);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setLoadError(photoErrorMessage(caught));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    shouldPollRef.current = shouldPoll;
    if (!shouldPoll) {
      return;
    }
    let cancelled = false;
    const startedAt = Date.now();
    let timer = 0;

    async function poll() {
      try {
        const items = await listOwnerPhotos();
        if (cancelled) {
          return;
        }
        setPhotos(items);
        await onReconcileRef.current();
        if (cancelled) {
          return;
        }
        if (!shouldPollRef.current) {
          setLoadError(undefined);
          return;
        }
        if (items.some(awaitingDerivative) && Date.now() - startedAt >= PROCESSING_NOTICE_MS) {
          setLoadError("This photo is still being prepared. Wait a moment, then try again.");
        }
      } catch (caught) {
        if (cancelled) {
          return;
        }
        setLoadError(photoErrorMessage(caught));
      }
      if (cancelled || !shouldPollRef.current) {
        return;
      }
      timer = window.setTimeout(() => {
        void poll();
      }, PROCESSING_POLL_MS);
    }

    timer = window.setTimeout(() => {
      void poll();
    }, PROCESSING_POLL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [shouldPoll]);

  useEffect(() => {
    return () => {
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const slots: Slot[] = [
    ...photos.map((photo) => ({ kind: "photo" as const, photo })),
    ...(localPreview
      ? [
          {
            kind: "local" as const,
            previewUrl: localPreview,
            progress: localState ?? "uploading",
            phase,
            percent,
            message: localMessage,
          },
        ]
      : [{ kind: "add" as const }]),
  ];

  function openPicker(replaceId?: number) {
    if (busyRef.current || pending) {
      return;
    }
    replaceIdRef.current = replaceId;
    fileRef.current?.click();
  }

  // No size check before this point on purpose. The old one was a copy of a
  // server rule that turned down the member's photo before anything had tried
  // to make it smaller — and since DateZA needs a photo before a profile can
  // go live, that was a wall with nothing behind it. Preparation runs first
  // now, and the server stays the authority on what is too big.
  async function uploadFile(file: File, replacing?: number) {
    if (busyRef.current) {
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setLoadError(undefined);
    setLocalMessage(undefined);
    setPhase("preparing");
    setPercent(0);
    lastFileRef.current = file;
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setLocalState("uploading");

    try {
      // Use the list the upload already fetched rather than asking again —
      // a second round trip here only delays the member and, when a photo is
      // still being prepared, hides the state that says so.
      let nextPhotos = await uploadAndAttachPhoto(file, undefined, {
        onPhase: setPhase,
        onProgress: (fraction) => setPercent(Math.round(fraction * 100)),
      });
      if (replacing !== undefined) {
        await deleteOwnerPhoto(replacing);
        nextPhotos = await listOwnerPhotos();
      }
      setPhotos(nextPhotos);
      await onReconcile();
      URL.revokeObjectURL(preview);
      setLocalPreview(undefined);
      setLocalState(undefined);
      lastFileRef.current = undefined;
    } catch (caught) {
      setLocalState("failed");
      setLocalMessage(photoErrorMessage(caught));
    } finally {
      replaceIdRef.current = undefined;
      busyRef.current = false;
      setBusy(false);
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  }

  /** Resends the photo already chosen; falls back to the picker if it is gone. */
  function retryUpload() {
    const file = lastFileRef.current;
    if (!file) {
      openPicker();
      return;
    }
    void uploadFile(file);
  }

  async function removePhoto(id: number) {
    if (busyRef.current || pending) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setLoadError(undefined);
    try {
      await deleteOwnerPhoto(id);
      const nextPhotos = await listOwnerPhotos();
      setPhotos(nextPhotos);
      await onReconcile();
    } catch (caught) {
      setLoadError(photoErrorMessage(caught));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const message = error ?? loadError;
  const primaryId = photos.find((photo) => photo.primary)?.id ?? photos[0]?.id;
  const addLabel =
    collection?.minimum_count && collection.minimum_count > 1
      ? `Add photo (${photos.length} of ${collection.minimum_count})`
      : "Add photo";

  return (
    <form
      className="auth-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canContinue || pending || busy) {
          return;
        }
        onContinue();
      }}
    >
      {message ? (
        <p className="auth-form__error" role="alert">
          {message}
        </p>
      ) : null}
      <input
        id={fileInputId}
        ref={fileRef}
        className="onboard-sr-only"
        type="file"
        aria-label="Choose a photo"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void uploadFile(file, replaceIdRef.current);
          }
        }}
      />
      <ul className="onboard-photos" aria-label="Your photos">
        {slots.map((slot, index) => {
          if (slot.kind === "add") {
            return (
              <li key="add">
                <button
                  className="onboard-photo-slot onboard-photo-slot--add"
                  type="button"
                  onClick={() => openPicker()}
                  disabled={busy || pending}
                >
                  <span className="onboard-photo-slot__plus" aria-hidden="true">
                    +
                  </span>
                  {addLabel}
                </button>
              </li>
            );
          }
          if (slot.kind === "local") {
            return (
              <li key="local">
                <div className="onboard-photo-slot onboard-photo-slot--busy">
                  <img src={slot.previewUrl} alt="" />
                  <div className="onboard-photo-slot__veil" role="status">
                    {slot.progress === "uploading"
                      ? slot.phase === "uploading" && slot.percent > 0
                        ? `Uploading… ${slot.percent}%`
                        : PHASE_LABEL[slot.phase]
                      : slot.message ?? "Couldn’t add that photo"}
                    {slot.progress === "failed" ? (
                      <button type="button" className="onboard-photo-slot__retry" onClick={retryUpload}>
                        Try again
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          }
          const { photo } = slot;
          const isMain = photo.id === primaryId;
          const preparingPhoto = awaitingDerivative(photo);
          const failed = photo.processing_state === "failed";
          const ready = hasReadyDerivative(photo);
          return (
            <li key={photo.id}>
              <figure className="onboard-photo-slot" aria-busy={preparingPhoto}>
                {photo.image?.url ? (
                  <img src={photo.image.url} alt={ready ? (isMain ? "Your main photo" : `Photo ${index + 1}`) : ""} />
                ) : (
                  <div className="onboard-photo-slot__empty">Preparing photo…</div>
                )}
                {isMain ? <figcaption className="onboard-photo-slot__badge">Main</figcaption> : null}
                {preparingPhoto ? (
                  <div className="onboard-photo-slot__veil" role="status">
                    Preparing photo…
                  </div>
                ) : null}
                {failed ? <div className="onboard-photo-slot__veil">This photo didn’t work</div> : null}
                <div className="onboard-photo-slot__actions">
                  <button type="button" onClick={() => openPicker(photo.id)} disabled={busy || pending}>
                    Replace
                  </button>
                  <button type="button" onClick={() => void removePhoto(photo.id)} disabled={busy || pending}>
                    Remove
                  </button>
                </div>
              </figure>
            </li>
          );
        })}
      </ul>
      <p className="auth-form__hint">
        {preparing
          ? "We’re preparing your photo. Continue unlocks when it’s ready."
          : "Use a clear photo where people can see you."}
      </p>
      <div className="onboard-actions">
        <button className="auth-form__submit" type="submit" disabled={!canContinue || pending || busy}>
          {pending ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}
