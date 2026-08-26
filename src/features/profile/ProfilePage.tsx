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
import { ProfileStandOutPrompt } from "./ProfileStandOutPrompt.tsx";
import { ownerPublicPreview } from "./ownerPublicPreview.ts";
import { RichProfileSkeleton, RichProfileView } from "./RichProfileView.tsx";

function ageFromBirthdate(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate);
  if (!match) return null;
  const born = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const notYetHadBirthdayThisYear =
    now.getUTCMonth() < born.getUTCMonth() ||
    (now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() < born.getUTCDate());
  if (notYetHadBirthdayThisYear) age -= 1;
  return age;
}

export default function ProfilePage() {
  const account = useOwnAccount();
  const { verification, pendingReason, openPrompt, dismiss } = useVerificationGate();
  const { signOut, pending: signingOut } = useSignOut();
  const [preview, setPreview] = useState<ProfileDetail | undefined>();
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    document.title = "Profile — DateZA";
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
        if (configResult.status === "fulfilled") setConfiguration(configResult.value.configuration);
        if (detailResult.status === "fulfilled") {
          setPreview(detailResult.value.profile);
        } else {
          const config = configResult.status === "fulfilled" ? configResult.value.configuration : undefined;
          setPreview(ownerPublicPreview(owner, nextPhotos, ageFromBirthdate(owner.birthdate), config));
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [account.profile]);

  if (account.loading) {
    return (
      <div className="shell-page">
        <p className="shell-page__subtitle">Loading your profile…</p>
      </div>
    );
  }

  const verified = canInteract(verification);

  return (
    <div className="shell-page">
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">My profile</p>
        <h1 className="shell-page__title">How you appear</h1>
        <p className="shell-page__subtitle">This is close to what other people see when they open your profile.</p>
      </div>

      <ProfileStandOutPrompt />

      {account.profile && preview?.id !== account.profile.id ? (
        <RichProfileSkeleton />
      ) : preview ? (
        <RichProfileView
          profile={preview}
          compatibility={preview.compatibility}
          configuration={configuration}
          photoIndex={photoIndex}
          onPhotoIndex={setPhotoIndex}
          mode="owner"
          onPhotosExpired={() => {
            if (!account.profile) return;
            void getProfileDetail(account.profile.id)
              .then((result) => setPreview(result.profile))
              .catch(() => undefined);
          }}
        />
      ) : (
        <RichProfileSkeleton />
      )}

      <div className="profile-section">
        <p className="profile-section__title">Account</p>
        {!verified ? (
          <button type="button" className="shell-row" onClick={() => openPrompt("profile")}>
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
        <Link to="/safety" className="shell-row">
          <span className="shell-row__icon">
            <ShieldIcon />
          </span>
          <span className="shell-row__body">
            <p className="shell-row__title">Safety &amp; support</p>
            <p className="shell-row__hint">Report, block, and safety resources</p>
          </span>
          <ChevronRightIcon className="shell-row__chevron" />
        </Link>
        <button type="button" className="shell-row" onClick={() => void signOut()} disabled={signingOut}>
          <span className="shell-row__body">
            <p className="shell-row__title">{signingOut ? "Signing out…" : "Sign out"}</p>
          </span>
        </button>
      </div>

      {pendingReason ? (
        <Modal ariaLabel="Verify your account" onClose={dismiss}>
          <VerificationFlow onDone={dismiss} />
        </Modal>
      ) : null}
    </div>
  );
}
