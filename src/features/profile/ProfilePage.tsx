import { useEffect, useId } from "react";
import { Link } from "react-router-dom";
import { useSignOut } from "../auth/useSignOut.ts";
import { canInteract } from "../session/verificationState.ts";
import { ShieldCheckIcon, ShieldIcon, GearIcon, ChevronRightIcon, CameraIcon, PencilIcon } from "../shell/icons.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { Modal } from "../verification/Modal.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { useVerificationGate } from "../verification/useVerificationGate.ts";

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
  const modalTitleId = useId();

  useEffect(() => {
    document.title = "Profile — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  if (account.loading) {
    return (
      <div className="shell-page shell-page--narrow">
        <p className="shell-page__subtitle">Loading your profile…</p>
      </div>
    );
  }

  const profile = account.profile;
  const verified = canInteract(verification);
  const age = ageFromBirthdate(profile?.birthdate ?? null);
  const location = [profile?.city, profile?.country_code].filter(Boolean).join(", ");

  return (
    <div className="shell-page shell-page--narrow">
      <div className="profile-hero">
        <div className="profile-hero__avatar">
          {account.avatarUrl ? (
            <img src={account.avatarUrl} width="72" height="72" alt="" />
          ) : (
            <span className="profile-hero__avatar-initial">{account.initial}</span>
          )}
        </div>
        <div>
          <h1 className="profile-hero__name">
            {account.displayName || "Your profile"}
            {age ? `, ${age}` : ""}
          </h1>
          {location ? <p className="profile-hero__meta">{location}</p> : null}
          {verified ? (
            <p className="profile-hero__badge profile-hero__badge--verified">
              <ShieldCheckIcon /> Contact verified
            </p>
          ) : (
            <button
              type="button"
              className="profile-hero__badge profile-hero__badge--pending profile-hero__badge--button"
              onClick={() => openPrompt("profile")}
            >
              <ShieldIcon /> Verify your account →
            </button>
          )}
        </div>
      </div>

      {profile?.bio ? (
        <div className="profile-section">
          <p className="profile-section__title">About</p>
          <p className="profile-section__text">{profile.bio}</p>
        </div>
      ) : null}

      <div className="profile-section">
        <Link to="/profile/edit" className="shell-row">
          <span className="shell-row__icon">
            <PencilIcon />
          </span>
          <span className="shell-row__body">
            <p className="shell-row__title">Edit profile</p>
            <p className="shell-row__hint">Name, bio, and the basics people see</p>
          </span>
          <ChevronRightIcon className="shell-row__chevron" />
        </Link>
        <Link to="/profile/photos" className="shell-row">
          <span className="shell-row__icon">
            <CameraIcon />
          </span>
          <span className="shell-row__body">
            <p className="shell-row__title">Photos</p>
            <p className="shell-row__hint">Manage the photos on your profile</p>
          </span>
          <ChevronRightIcon className="shell-row__chevron" />
        </Link>
        <button type="button" className="shell-row" onClick={() => openPrompt("profile")}>
          <span className="shell-row__icon">
            <ShieldCheckIcon />
          </span>
          <span className="shell-row__body">
            <p className="shell-row__title">Contact verification</p>
            <p className="shell-row__hint">Confirm your email or phone</p>
          </span>
          <span className={`shell-row__status ${verified ? "shell-row__status--verified" : "shell-row__status--pending"}`}>
            {verified ? "Verified" : "Pending"}
          </span>
        </button>
      </div>

      <div className="profile-section">
        <p className="profile-section__title">Account</p>
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
        <Modal titleId={modalTitleId} onClose={dismiss}>
          <VerificationFlow onDone={dismiss} />
        </Modal>
      ) : null}
    </div>
  );
}
