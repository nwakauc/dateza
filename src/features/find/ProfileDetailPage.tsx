import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getProfileDetail, likeProfile, passProfile } from "../../lib/api/find.ts";
import { getProfileConfiguration } from "../../lib/api/profile.ts";
import { ApiError } from "../../lib/api/errors.ts";
import type { DatezaCompatibility, ProfileDetail } from "../../lib/api/findTypes.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { SessionStatusPage } from "../session/SessionStatusPage.tsx";
import { MatchModal } from "../shell/MatchModal.tsx";
import { RichProfileSkeleton, RichProfileView } from "../profile/RichProfileView.tsx";
import { originBack, profileOriginFromState } from "../profile/profileOrigin.ts";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { useVerificationGate } from "../verification/useVerificationGate.ts";

function detailErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "This profile is not available.";
  }
  return "We could not load this profile. Try again.";
}

function compatibilityFromState(state: unknown): DatezaCompatibility {
  if (typeof state !== "object" || state === null) return null;
  const value = (state as { compatibility?: unknown }).compatibility;
  return value && typeof value === "object" ? (value as DatezaCompatibility) : null;
}

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

  useEffect(() => {
    if (!verified || !id) return;
    let cancelled = false;
    getProfileDetail(id)
      .then((result) => {
        if (!cancelled) setProfile(result.profile);
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
        <Link className="onboard-back-top" to={back.to}>
          {back.label}
        </Link>
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
      <Link className="onboard-back-top" to={back.to}>
        {back.label}
      </Link>
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
