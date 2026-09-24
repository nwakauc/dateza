import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { deleteOwnerPhoto, listOwnerPhotos } from "../../lib/api/photos.ts";
import { photoErrorMessage, uploadAndAttachPhoto } from "./photoActions.ts";
import type { OwnerPhoto } from "../../lib/api/photoTypes.ts";
import { useOwnAccount } from "../shell/useOwnAccount.ts";


export default function PhotosPage() {
  const account = useOwnAccount();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  const [photos, setPhotos] = useState<OwnerPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    document.title = "Photos — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listOwnerPhotos()
      .then((items) => {
        if (!cancelled) setPhotos(items);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(photoErrorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function uploadFile(file: File) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    setProgress(undefined);
    try {
      // Same shared path as onboarding: prepare, then hash and declare the
      // bytes actually sent. No client-side size rule — the server owns that,
      // and a photo too big to send is a photo we should shrink, not refuse.
      setPhotos(
        await uploadAndAttachPhoto(file, undefined, {
          onProgress: (fraction) => setProgress(Math.round(fraction * 100)),
        }),
      );
      account.refresh();
    } catch (caught) {
      setError(photoErrorMessage(caught));
    } finally {
      busyRef.current = false;
      setBusy(false);
      setProgress(undefined);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto(id: number) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      await deleteOwnerPhoto(id);
      setPhotos(await listOwnerPhotos());
      account.refresh();
    } catch (caught) {
      setError(photoErrorMessage(caught));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="shell-page shell-page--narrow">
      <Link className="onboard-back-top" to="/profile">
        ← Back to profile
      </Link>
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Your profile</p>
        <h1 className="shell-page__title">Photos</h1>
        <p className="shell-page__subtitle">Your first photo is what people see first on Discover and Find.</p>
      </div>

      {error ? (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="shell-page__subtitle">Loading your photos…</p>
      ) : (
        <div className="profile-photos-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="profile-photos-grid__item">
              {photo.image?.url ? <img src={photo.image.url} alt="" /> : null}
              <button
                type="button"
                className="profile-photos-grid__remove"
                onClick={() => void removePhoto(photo.id)}
                disabled={busy}
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            className="profile-photos-grid__empty"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label="Add photo"
          >
            {busy ? (progress === undefined ? "…" : `${progress}%`) : "+"}
          </button>
        </div>
      )}

      <input
        id={fileInputId}
        ref={fileRef}
        className="onboard-sr-only"
        type="file"
        aria-label="Choose a photo"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
        }}
      />
    </div>
  );
}
