import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { md5Base64 } from "../../lib/api/checksum.ts";
import { ApiError } from "../../lib/api/errors.ts";
import {
  attachOwnerPhoto,
  createPhotoUploadIntent,
  deleteOwnerPhoto,
  isAllowedPhotoType,
  listOwnerPhotos,
  putPhotoBytes,
} from "../../lib/api/photos.ts";
import type { OwnerPhoto } from "../../lib/api/photoTypes.ts";
import { useOwnAccount } from "../shell/useOwnAccount.ts";

function photoErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "unsupported_content_type") return "Use a JPEG, PNG, or WebP photo.";
    if (error.code === "invalid_byte_size") return "That photo is too large. Choose one under 10 MB.";
    if (error.code === "invalid_image") return "That file doesn’t look like a photo. Try another.";
  }
  return "We could not update your photos. Try again.";
}

function contentTypeFor(file: File): string | undefined {
  if (isAllowedPhotoType(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return undefined;
}

export default function PhotosPage() {
  const account = useOwnAccount();
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  const [photos, setPhotos] = useState<OwnerPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
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
    const contentType = contentTypeFor(file);
    if (!contentType) {
      setError("Use a JPEG, PNG, or WebP photo.");
      return;
    }
    if (file.size < 1 || file.size > 10 * 1024 * 1024) {
      setError("That photo is too large. Choose one under 10 MB.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const bytes = await file.arrayBuffer();
      const intent = await createPhotoUploadIntent({
        content_type: contentType,
        byte_size: bytes.byteLength,
        checksum: md5Base64(bytes),
        filename: file.name,
      });
      await putPhotoBytes(intent.url, intent.headers, bytes);
      await attachOwnerPhoto(intent.signed_id);
      setPhotos(await listOwnerPhotos());
      account.refresh();
    } catch (caught) {
      setError(photoErrorMessage(caught));
    } finally {
      busyRef.current = false;
      setBusy(false);
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
            {busy ? "…" : "+"}
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
