import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProfileDetail } from "../../lib/api/find.ts";
import { listOwnerPhotos } from "../../lib/api/photos.ts";
import { getProfileConfiguration } from "../../lib/api/profile.ts";
import type { ProfileDetail } from "../../lib/api/findTypes.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { useSignOut } from "../auth/useSignOut.ts";
import { canInteract } from "../session/verificationState.ts";
import { GearIcon, ChevronRightIcon, ShieldCheckIcon, ShieldIcon } from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { Modal } from "../verification/Modal.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { useVerificationGate } from "../verification/useVerificationGate.ts";
import { ageFromBirthdate } from "./ageFromBirthdate.ts";
import { ProfileManageNav } from "./ProfileManageNav.tsx";
import { ProfileStrengthCard } from "./edit/ProfileStrengthCard.tsx";
import { forOwnerPreview, ownerPublicPreview } from "./ownerPublicPreview.ts";
import { datezaRichness } from "./richProfileGaps.ts";
import { RichProfileSkeleton, RichProfileView } from "./RichProfileView.tsx";

function AccountLinks({
  verified,
  onVerify,
  signingOut,
  onSignOut,
}: {
  verified: boolean;
  onVerify: () => void;
  signingOut: boolean;
  onSignOut: () => void;
}) {
  return (
    <div className="profile-section">
      <p className="profile-section__title">Account</p>
      {!verified ? (
        <button type="button" className="shell-row" onClick={onVerify}>
          <span className="shell-row__icon">
            <ShieldIcon />
          </span>
          <span className="shell-row__body">
            <p className="shell-row__title">Contact verification</p>
            <p className="shell-row__hint">Confirm your email or phone</p>
          </span>
          <span className="shell-row__status shell-row__status--pending">Pending</span>
        </button>
      ) : (
        <div className="shell-row shell-row--static">
          <span className="shell-row__icon">
            <ShieldCheckIcon />
          </span>
          <span className="shell-row__body">
            <p className="shell-row__title">{VERIFIED_CONTACT_LABEL}</p>
          </span>
        </div>
      )}
      <Link to="/settings" className="shell-row">
        <span className="shell-row__icon">
          <GearIcon />
        </span>
        <span className="shell-row__body">
          <p className="shell-row__title">Settings</p>
        </span>
        <ChevronRightIcon className="shell-row__chevron" />
      </Link>
      <Link to="/settings/safety" className="shell-row">
        <span className="shell-row__icon">
          <ShieldIcon />
        </span>
        <span className="shell-row__body">
          <p className="shell-row__title">Safety &amp; support</p>
          <p className="shell-row__hint">Report, block, and safety resources</p>
        </span>
        <ChevronRightIcon className="shell-row__chevron" />
      </Link>
      <button type="button" className="shell-row" onClick={onSignOut} disabled={signingOut}>
        <span className="shell-row__body">
          <p className="shell-row__title">{signingOut ? "Signing out…" : "Sign out"}</p>
        </span>
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const account = useOwnAccount();
  const { verification, pendingReason, openPrompt, dismiss } = useVerificationGate();
  const { signOut, pending: signingOut } = useSignOut();
  const [preview, setPreview] = useState<ProfileDetail | undefined>();
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    document.title = "My profile — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  useEffect(() => {
    const owner = account.profile;
    if (!owner) return;
    let cancelled = false;
    void Promise.allSettled([getProfileDetail(owner.id), listOwnerPhotos(), getProfileConfiguration()]).then(
      ([detailResult, photosResult, configResult]) => {
        if (cancelled) return;
        const nextPhotos = photosResult.status === "fulfilled" ? photosResult.value : [];
        const config = configResult.status === "fulfilled" ? configResult.value.configuration : undefined;
        if (config) setConfiguration(config);
        if (detailResult.status === "fulfilled") {
          setPreview(forOwnerPreview(detailResult.value.profile));
        } else {
          setPreview(ownerPublicPreview(owner, nextPhotos, ageFromBirthdate(owner.birthdate), config));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [account.profile]);

  const verified = canInteract(verification);
  const richness = datezaRichness(account.profile, account.photoCount);
  const loading = account.loading || Boolean(account.profile && preview?.id !== account.profile.id);

  function refreshPreview() {
    if (!account.profile) return;
    void getProfileDetail(account.profile.id)
      .then((result) => setPreview(forOwnerPreview(result.profile)))
      .catch(() => undefined);
  }

  return (
    <div className="shell-page my-profile">
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">My profile</p>
        <p className="shell-page__title">How you appear</p>
        <p className="shell-page__subtitle">This is close to what other people see when they open your profile.</p>
      </div>

      <div className="my-profile__grid">
        <aside className="my-profile__manage" aria-label="Profile management">
          <p className="my-profile__manage-label">Edit profile</p>
          <ProfileManageNav current="preview" />
          <div className="my-profile__manage-strength">
            {account.profile ? (
              <ProfileStrengthCard profileCompletion={account.profile.profile_completion ?? null} richness={richness} />
            ) : null}
          </div>
        </aside>

        <div className="my-profile__stage">
          {loading ? (
            <RichProfileSkeleton owner />
          ) : preview ? (
            <RichProfileView
              profile={preview}
              compatibility={null}
              configuration={configuration}
              photoIndex={photoIndex}
              onPhotoIndex={setPhotoIndex}
              mode="owner"
              onPhotosExpired={refreshPreview}
            />
          ) : (
            <RichProfileSkeleton owner />
          )}

          <div className="my-profile__after">
            <div className="my-profile__mobile-strength">
              {account.profile ? (
                <ProfileStrengthCard profileCompletion={account.profile.profile_completion ?? null} richness={richness} />
              ) : null}
            </div>
            <AccountLinks
              verified={verified}
              onVerify={() => openPrompt("profile")}
              signingOut={signingOut}
              onSignOut={() => void signOut()}
            />
          </div>
        </div>
      </div>

      {pendingReason ? (
        <Modal ariaLabel="Verify your account" onClose={dismiss}>
          <VerificationFlow onDone={dismiss} />
        </Modal>
      ) : null}
    </div>
  );
}
