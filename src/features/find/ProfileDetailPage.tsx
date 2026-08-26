import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getProfileDetail, likeProfile, passProfile } from "../../lib/api/find.ts";
import { getProfileConfiguration } from "../../lib/api/profile.ts";
import { ApiError } from "../../lib/api/errors.ts";
import type { DatezaCompatibility, ProfileDetail } from "../../lib/api/findTypes.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { SessionStatusPage } from "../session/SessionStatusPage.tsx";
import { MatchModal } from "../shell/MatchModal.tsx";
import { ProfileSafetyActions } from "../profile/ProfileSafetyActions.tsx";
import { RichProfileSkeleton, RichProfileView } from "../profile/RichProfileView.tsx";
import { originBack, profileOriginFromState } from "../profile/profileOrigin.ts";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { useVerificationGate } from "../verification/useVerificationGate.ts";

function detailErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 404 || error.code === "profile_unavailable")) {
    return "This profile is not available.";
  }
  return "We could not load this profile. Try again.";
}

function compatibilityFromState(state: unknown): DatezaCompatibility {
  if (typeof state !== "object" || state === null) return null;
  const value = (state as { compatibility?: unknown }).compatibility;
  return value && typeof value === "object" ? (value as DatezaCompatibility) : null;
}

const PHOTO_REFRESH_BUFFER_MS = 20_000;

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { verified } = useVerificationGate();
  const origin = profileOriginFromState(routerLocation.state);
  const routedCompatibility = compatibilityFromState(routerLocation.state);
  const back = originBack(origin);
  const [profile, setProfile] = useState<ProfileDetail | undefined>();
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [interaction, setInteraction] = useState<"idle" | "liked" | "passed">("idle");
  const [busy, setBusy] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const photoRetryRef = useRef(false);

  const refreshProfile = useCallback(
    (showLoading: boolean) => {
      if (!id) return Promise.resolve();
      if (showLoading) setLoading(true);
      return getProfileDetail(id)
        .then((result) => {
          setProfile(result.profile);
          setError(undefined);
          photoRetryRef.current = false;
        })
        .catch((caught: unknown) => {
          setError(detailErrorMessage(caught));
          if (showLoading) setProfile(undefined);
        })
        .finally(() => {
          if (showLoading) setLoading(false);
        });
    },
    [id],
  );

  useEffect(() => {
    if (!verified || !id) return;
    let cancelled = false;
    getProfileDetail(id)
      .then((result) => {
        if (!cancelled) {
          setProfile(result.profile);
          setError(undefined);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(detailErrorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    getProfileConfiguration()
      .then((result) => {
        if (!cancelled) setConfiguration(result.configuration);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [id, verified]);

  useEffect(() => {
    if (!profile || profile.photos.length === 0) return;
    const soonest = Math.min(...profile.photos.map((photo) => photo.url_expires_in));
    if (!Number.isFinite(soonest) || soonest <= 0) return;
    const wait = Math.max(5_000, soonest * 1000 - PHOTO_REFRESH_BUFFER_MS);
    const timer = window.setTimeout(() => {
      void refreshProfile(false);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [profile, refreshProfile]);

  function like() {
    if (!profile || busy || interaction !== "idle") return;
    setBusy(true);
    likeProfile(profile.id)
      .then((result) => {
        setInteraction("liked");
        if (result.matched) setMatchId(result.match_id);
      })
      .catch(() => undefined)
      .finally(() => setBusy(false));
  }

  function pass() {
    if (!profile || busy || interaction !== "idle") return;
    setBusy(true);
    passProfile(profile.id)
      .then(() => setInteraction("passed"))
      .catch(() => undefined)
      .finally(() => setBusy(false));
  }

  if (!id) {
    return <SessionStatusPage title="Profile not found" body="This link is not valid." />;
  }

  if (!verified) {
    return (
      <div className="auth-screen">
        <div className="auth-screen__panel">
          <VerificationFlow onDone={() => navigate(back.to, { replace: true })} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shell-page">
        <div className="rich-profile-toolbar">
          <Link className="onboard-back-top" to={back.to}>
            {back.label}
          </Link>
        </div>
        <RichProfileSkeleton />
      </div>
    );
  }

  if (error || !profile) {
    return <SessionStatusPage title="We could not load this profile" body={error ?? "Try again."} />;
  }

  const name = profile.display_name ?? "DateZA member";
  const compatibility = profile.compatibility ?? routedCompatibility;

  return (
    <div className="shell-page">
      <div className="rich-profile-toolbar">
        <Link className="onboard-back-top" to={back.to}>
          {back.label}
        </Link>
      </div>
      <RichProfileView
        profile={profile}
        compatibility={compatibility}
        configuration={configuration}
        photoIndex={photoIndex}
        onPhotoIndex={setPhotoIndex}
        mode="member"
        busy={busy}
        interaction={interaction}
        onLike={like}
        onPass={pass}
        onPhotosExpired={() => {
          if (photoRetryRef.current) return;
          photoRetryRef.current = true;
          void refreshProfile(false);
        }}
        safety={
          <ProfileSafetyActions
            profileId={profile.id}
            name={name}
            onBlocked={() => navigate(back.to, { replace: true })}
          />
        }
      />
      {matchId ? (
        <MatchModal
          name={name}
          photoUrl={profile.photos[0]?.url}
          matchId={matchId}
          continueLabel={back.label}
          onContinue={() => navigate(back.to)}
        />
      ) : null}
    </div>
  );
}
