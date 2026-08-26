import type { PublicProfilePhoto } from "../../lib/api/findTypes.ts";
import { ShieldCheckIcon } from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";

type Props = {
  photos: PublicProfilePhoto[];
  name: string;
  photoIndex: number;
  onPhotoIndex: (index: number) => void;
  verified: boolean;
};

export function ProfileGallery({ photos, name, photoIndex, onPhotoIndex, verified }: Props) {
  const active = photos[photoIndex];
  const strip = photos.slice(0, 3);
  const extra = photos.length - strip.length;

  function show(index: number) {
    onPhotoIndex(Math.max(0, Math.min(index, photos.length - 1)));
  }

  return (
    <div className="rich-gallery">
      <div className="rich-gallery__stage">
        {active ? (
          <img src={active.url} alt={`${name}, photo ${photoIndex + 1} of ${photos.length || 1}`} />
        ) : (
          <div className="rich-gallery__placeholder" aria-hidden="true" />
        )}
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
                <span>View photos</span>
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
            <button type="button" className="rich-gallery__nav rich-gallery__nav--prev" aria-label="Previous photo" onClick={() => show(photoIndex - 1)} disabled={photoIndex === 0} />
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
      {photos.length > 1 ? (
        <div className="rich-gallery__strip" role="tablist" aria-label="Photos">
          {strip.map((photo, index) => {
            const overflow = index === strip.length - 1 && extra > 0;
            return (
              <button
                key={photo.id}
                type="button"
                role="tab"
                aria-selected={photoIndex === index}
                className={photoIndex === index ? "rich-gallery__thumb rich-gallery__thumb--active" : "rich-gallery__thumb"}
                onClick={() => show(overflow ? Math.min(photos.length - 1, Math.max(index, photoIndex + 1)) : index)}
              >
                <img src={photo.url} alt="" />
                {overflow ? <span className="rich-gallery__more">+{extra}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
