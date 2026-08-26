import { type KeyboardEvent, type ReactNode } from "react";
import type { PublicProfilePhoto } from "../../lib/api/findTypes.ts";
import { ShieldCheckIcon } from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";

const STRIP_SLOTS = 3;

type Props = {
  photos: PublicProfilePhoto[];
  name: string;
  photoIndex: number;
  onPhotoIndex: (index: number) => void;
  verified: boolean;
  onPhotosExpired?: () => void;
  overlay?: ReactNode;
};

export function ProfileGallery({ photos, name, photoIndex, onPhotoIndex, verified, onPhotosExpired, overlay }: Props) {
  const active = photos[photoIndex];
  const others = photos
    .map((photo, index) => ({ photo, index }))
    .filter((item) => item.index !== photoIndex);
  const strip = others.slice(0, STRIP_SLOTS);
  const extra = others.length - strip.length;

  function show(index: number) {
    if (photos.length === 0) return;
    onPhotoIndex(Math.max(0, Math.min(index, photos.length - 1)));
  }

  function onGalleryKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(photoIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(photoIndex - 1);
    }
  }

  return (
    <div className="rich-gallery" onKeyDown={onGalleryKey}>
      <div className="rich-gallery__hero">
        <div className={photos.length === 0 ? "rich-gallery__stage rich-gallery__stage--empty" : "rich-gallery__stage"}>
          {active ? (
            <img
              src={active.url}
              alt={`${name}, photo ${photoIndex + 1} of ${photos.length}`}
              loading="eager"
              decoding="async"
              onError={() => onPhotosExpired?.()}
            />
          ) : (
            <div className="rich-gallery__placeholder" aria-hidden="true" />
          )}
          {photos.length === 0 ? <p className="rich-gallery__empty">Photos aren’t showing yet.</p> : null}
          {verified ? (
            <span className="rich-gallery__verified">
              <ShieldCheckIcon className="rich-gallery__verified-icon" />
              {VERIFIED_CONTACT_LABEL}
            </span>
          ) : null}
          {photos.length > 0 ? (
            <p className="rich-gallery__count">
              {photos.length > 1 ? (
                <>
                  <span>View all photos</span>
                  <span>
                    {photoIndex + 1} / {photos.length}
                  </span>
                </>
              ) : (
                <span>1 photo</span>
              )}
            </p>
          ) : null}
          {photos.length > 1 ? (
            <>
              <span className="sr-only" aria-live="polite">
                Photo {photoIndex + 1} of {photos.length}
              </span>
              <button
                type="button"
                className="rich-gallery__nav rich-gallery__nav--prev"
                aria-label="Previous photo"
                onClick={() => show(photoIndex - 1)}
                disabled={photoIndex === 0}
              />
              <button
                type="button"
                className="rich-gallery__nav rich-gallery__nav--next"
                aria-label="Next photo"
                onClick={() => show(photoIndex + 1)}
                disabled={photoIndex === photos.length - 1}
              />
            </>
          ) : null}
        </div>
        {overlay}
      </div>
      {photos.length > 1 ? (
        <div className="rich-gallery__strip" role="group" aria-label="More photos">
          {strip.map((item, slot) => {
            const overflow = extra > 0 && slot === strip.length - 1;
            return (
              <button
                key={item.photo.id}
                type="button"
                aria-label={overflow ? `${extra} more photos` : `Photo ${item.index + 1}`}
                className="rich-gallery__thumb"
                onClick={() => show(overflow ? others[STRIP_SLOTS].index : item.index)}
              >
                <img src={item.photo.url} alt="" />
                {overflow ? <span className="rich-gallery__more">+{extra}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
