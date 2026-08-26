import { useEffect, useId, useRef, useState } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { md5Base64 } from "../../lib/api/checksum.ts";
import {
  attachOwnerPhoto,
  createPhotoUploadIntent,
  deleteOwnerPhoto,
  isAllowedPhotoType,
  listOwnerPhotos,
  putPhotoBytes,
} from "../../lib/api/photos.ts";
import type { OwnerPhoto } from "../../lib/api/photoTypes.ts";
import type { ConfiguredCollection, ProfileOnboardingStatus } from "../../lib/api/profileTypes.ts";
import { onboardingErrorMessage } from "./onboardingErrors.ts";

type Slot =
  | { kind: "photo"; photo: OwnerPhoto }
  | { kind: "local"; previewUrl: string; progress: "uploading" | "failed"; message?: string }
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
    if (error.code === "unsupported_content_type") {
      return "Use a JPEG, PNG, or WebP photo.";
    }
    if (error.code === "invalid_byte_size") {
      return "That photo is too large. Choose one under 10 MB.";
    }
    if (error.code === "invalid_image") {
      return "That file doesn’t look like a photo. Try another.";
    }
    if (error.code === "upload_put_failed" || error.code === "upload_not_found") {
      return "The upload didn’t finish. Try again.";
    }
    if (error.code === "upload_already_used") {
      return "That upload was already used. Choose the photo again.";
    }
  }
  return onboardingErrorMessage(error);
}

function contentTypeFor(file: File): string | undefined {
  if (isAllowedPhotoType(file.type)) {
    return file.type;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (name.endsWith(".png")) {
    return "image/png";
  }
  if (name.endsWith(".webp")) {
    return "image/webp";
  }
  return undefined;
}

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

  async function uploadFile(file: File) {
    if (busyRef.current) {
      return;
    }
    const contentType = contentTypeFor(file);
    if (!contentType) {
      setLoadError("Use a JPEG, PNG, or WebP photo.");
      return;
    }
    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      setLoadError("That photo is too large. Choose one under 10 MB.");
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setLoadError(undefined);
    setLocalMessage(undefined);
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setLocalState("uploading");

    try {
      const bytes = await file.arrayBuffer();
      const checksum = md5Base64(bytes);
      const intent = await createPhotoUploadIntent({
        content_type: contentType,
        byte_size: bytes.byteLength,
        checksum,
        filename: file.name,
      });
      await putPhotoBytes(intent.url, intent.headers, bytes);
      await attachOwnerPhoto(intent.signed_id);
      const replacing = replaceIdRef.current;
      if (replacing !== undefined) {
        await deleteOwnerPhoto(replacing);
      }
      const nextPhotos = await listOwnerPhotos();
      setPhotos(nextPhotos);
      await onReconcile();
      URL.revokeObjectURL(preview);
      setLocalPreview(undefined);
      setLocalState(undefined);
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
            void uploadFile(file);
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
                  <div className="onboard-photo-slot__veil">
                    {slot.progress === "uploading" ? "Uploading…" : slot.message ?? "Couldn’t add that photo"}
                    {slot.progress === "failed" ? (
                      <button type="button" className="onboard-photo-slot__retry" onClick={() => openPicker()}>
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
