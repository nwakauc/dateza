import { useEffect, useId, useRef, useState } from "react";
import type { ConfiguredCollection } from "../../../lib/api/profileTypes.ts";
import type { OwnerPhoto } from "../../../lib/api/photoTypes.ts";
import { deleteOwnerPhoto, listOwnerPhotos } from "../../../lib/api/photos.ts";
import { photoErrorMessage, replaceOwnerPhoto, uploadAndAttachPhoto } from "../photoActions.ts";

type Slot =
  | { kind: "photo"; photo: OwnerPhoto }
  | { kind: "local"; previewUrl: string; progress: "uploading" | "failed"; message?: string }
  | { kind: "add" };

type Props = {
  collection?: ConfiguredCollection;
  onChanged: (photos: OwnerPhoto[]) => void;
};

export function EditPhotosSection({ collection, onChanged }: Props) {
  const fileInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceIdRef = useRef<number | undefined>(undefined);
  const busyRef = useRef(false);
  const [photos, setPhotos] = useState<OwnerPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [localPreview, setLocalPreview] = useState<string | undefined>();
  const [localState, setLocalState] = useState<"uploading" | "failed" | undefined>();
  const [localMessage, setLocalMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

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

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const max = collection?.maximum_count;
  const atMax = max != null && photos.length >= max && !localPreview;
  const slots: Slot[] = [
    ...photos.map((photo) => ({ kind: "photo" as const, photo })),
    ...(localPreview
      ? [{ kind: "local" as const, previewUrl: localPreview, progress: localState ?? "uploading", message: localMessage }]
      : atMax
        ? []
        : [{ kind: "add" as const }]),
  ];

  function openPicker(replaceId?: number) {
    if (busyRef.current) return;
    replaceIdRef.current = replaceId;
    fileRef.current?.click();
  }

  async function onFile(file: File) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    setLocalMessage(undefined);
    if (localPreview) URL.revokeObjectURL(localPreview);
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setLocalState("uploading");
    try {
      const replacing = replaceIdRef.current;
      const next = replacing != null ? await replaceOwnerPhoto(file, replacing) : await uploadAndAttachPhoto(file);
      setPhotos(next);
      URL.revokeObjectURL(preview);
      setLocalPreview(undefined);
      setLocalState(undefined);
      onChanged(next);
    } catch (caught) {
      setLocalState("failed");
      setLocalMessage(photoErrorMessage(caught));
    } finally {
      replaceIdRef.current = undefined;
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
      const next = await listOwnerPhotos();
      setPhotos(next);
      onChanged(next);
    } catch {
      setError("We couldn't remove that photo. Try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  const primaryId = photos.find((photo) => photo.primary)?.id ?? photos[0]?.id;
  const headingCount = max != null ? `Photos (${photos.length}/${max})` : `Photos (${photos.length})`;

  return (
    <section className="edit-profile__block">
      <header className="edit-profile__block-head">
        <h2>{headingCount}</h2>
        <p>
          {max != null
            ? `Add up to ${max} photos. The first photo is what people see first.`
            : "The first photo is what people see first on Discover and Find."}
        </p>
      </header>
      {error ? (
        <p className="auth-form__error" role="alert">
          {error}
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
          if (file) void onFile(file);
        }}
      />
      {loading ? (
        <div className="edit-profile__photo-grid edit-profile__photo-grid--skeleton" aria-hidden="true">
          <div className="edit-profile__photo-slot edit-skeleton" />
          <div className="edit-profile__photo-slot edit-skeleton" />
          <div className="edit-profile__photo-slot edit-skeleton" />
        </div>
      ) : (
        <ul className="edit-profile__photo-grid" aria-label="Your photos">
          {slots.map((slot, index) => {
            if (slot.kind === "add") {
              return (
                <li key="add">
                  <button
                    className="edit-profile__photo-slot edit-profile__photo-slot--add"
                    type="button"
                    onClick={() => openPicker()}
                    disabled={busy}
                  >
                    <span aria-hidden="true">+</span>
                    Add photo
                  </button>
                </li>
              );
            }
            if (slot.kind === "local") {
              return (
                <li key="local">
                  <div className="edit-profile__photo-slot edit-profile__photo-slot--busy">
                    <img src={slot.previewUrl} alt="" />
                    <div className="edit-profile__photo-veil">
                      {slot.progress === "uploading" ? "Uploading…" : slot.message ?? "Couldn't add that photo"}
                      {slot.progress === "failed" ? (
                        <button type="button" onClick={() => openPicker()}>
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
            const failed = photo.processing_state === "failed";
            const processing = photo.processing_state === "pending" || photo.processing_state === "processing";
            return (
              <li key={photo.id}>
                <figure className="edit-profile__photo-slot">
                  {photo.image?.url ? (
                    <img src={photo.image.url} alt={isMain ? "Your main photo" : `Photo ${index + 1}`} />
                  ) : (
                    <div className="edit-profile__photo-veil">{processing ? "Getting this ready…" : "Photo unavailable"}</div>
                  )}
                  {isMain ? <figcaption className="edit-profile__photo-badge">Main</figcaption> : null}
                  {failed ? <div className="edit-profile__photo-veil">This photo didn’t work</div> : null}
                  <div className="edit-profile__photo-actions">
                    <button type="button" onClick={() => openPicker(photo.id)} disabled={busy}>
                      Replace
                    </button>
                    <button type="button" onClick={() => void removePhoto(photo.id)} disabled={busy}>
                      Remove
                    </button>
                  </div>
                </figure>
              </li>
            );
          })}
        </ul>
      )}
      <p className="auth-form__hint">Tip: Good lighting and a clear face help you get more likes.</p>
      <p className="auth-form__hint">
        Photo order is set when you add them. Reordering after upload isn’t available yet — the first photo stays your main
        photo.
      </p>
    </section>
  );
}
