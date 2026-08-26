import type { OwnerPhoto } from "../../../lib/api/photoTypes.ts";
import type { OwnerProfile, ProfileConfiguration } from "../../../lib/api/profileTypes.ts";
import { MapPinIcon } from "../../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../../shell/trustLabels.ts";
import { ageFromBirthdate } from "../ageFromBirthdate.ts";
import { identityLocation, interestLabels } from "../richProfileContent.ts";
import { ownerPublicPreview } from "../ownerPublicPreview.ts";
import { buildOptionLabelLookup } from "../../find/optionLabels.ts";

type Props = {
  owner: OwnerProfile;
  photos: OwnerPhoto[];
  configuration?: ProfileConfiguration;
};

export function EditPreviewCard({ owner, photos, configuration }: Props) {
  const preview = ownerPublicPreview(owner, photos, ageFromBirthdate(owner.birthdate), configuration);
  const name = preview.display_name ?? "DateZA member";
  const location = identityLocation(preview);
  const optionLabel = buildOptionLabelLookup(configuration);
  const intent = optionLabel("relationship_intent", preview.options.relationship_intent?.[0] ?? "") ?? null;
  const interests = interestLabels(preview).slice(0, 5);
  const primary = preview.photos.find((photo) => photo.primary) ?? preview.photos[0];
  const bio = preview.bio?.trim() ?? "";

  return (
    <section className="edit-preview" aria-label="Profile preview">
      <h2>Profile preview</h2>
      <p className="edit-preview__sub">This is how others see your profile.</p>
      <article className="edit-preview__card">
        <div className="edit-preview__hero">
          {primary?.url ? <img src={primary.url} alt="" /> : <div className="edit-preview__empty">Add a photo</div>}
          {preview.photos.length > 1 ? (
            <span className="edit-preview__count">{preview.photos.length} photos</span>
          ) : null}
        </div>
        <div className="edit-preview__body">
          <h3>
            {name}
            {preview.age != null ? <span>, {preview.age}</span> : null}
            {preview.verified ? (
              <span className="edit-preview__verified" title={VERIFIED_CONTACT_LABEL}>
                ✓
              </span>
            ) : null}
          </h3>
          {location ? (
            <p className="edit-preview__loc">
              <MapPinIcon className="edit-preview__pin" />
              {location}
            </p>
          ) : null}
          {intent ? <p className="edit-preview__pill">{intent}</p> : null}
          {bio ? <p className="edit-preview__bio">{bio.length > 140 ? `${bio.slice(0, 137)}…` : bio}</p> : null}
          {interests.length > 0 ? (
            <div className="edit-preview__interests">
              {interests.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
