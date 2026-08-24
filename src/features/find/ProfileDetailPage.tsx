import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProfileDetail, likeProfile } from "../../lib/api/find.ts";
import { ApiError } from "../../lib/api/errors.ts";
import type { ProfileDetail } from "../../lib/api/findTypes.ts";
import { SessionStatusPage } from "../session/SessionStatusPage.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { useVerificationGate } from "../verification/useVerificationGate.ts";

function detailErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "This profile is not available.";
  }
  return "We could not load this profile. Try again.";
}

export default function ProfileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { verified } = useVerificationGate();
  const [profile, setProfile] = useState<ProfileDetail | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!verified || !id) {
      // Unverified: the component renders the verification flow before ever
      // consulting `loading` below, so there is nothing to synchronize here.
      return;
    }
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
    return () => {
      cancelled = true;
    };
  }, [id, verified]);

  if (!id) {
    return <SessionStatusPage title="Profile not found" body="This link is not valid." />;
  }

  // Route-level enforcement (item 14): an unverified member never receives
  // profile detail content here, regardless of how this route was reached.
  if (!verified) {
    return (
      <div className="auth-screen">
        <div className="auth-screen__panel">
          <VerificationFlow onDone={() => navigate("/find", { replace: true })} />
        </div>
      </div>
    );
  }

  if (loading) {
    return <SessionStatusPage title="Loading profile…" body="Just a moment." busy />;
  }

  if (error || !profile) {
    return <SessionStatusPage title="We could not load this profile" body={error ?? "Try again."} />;
  }

  const location = [profile.city, profile.country_code].filter(Boolean).join(", ");

  return (
    <div className="shell-page">
      <Link className="onboard-back-top" to="/find">
        ← Back to Find
      </Link>
      <article className="profile-detail">
        <div className="profile-detail__photos">
          {profile.photos.length > 0 ? (
            profile.photos.map((photo) => <img key={photo.id} src={photo.url} alt="" />)
          ) : (
            <div className="discover-card__photo-placeholder" aria-hidden="true" />
          )}
        </div>
        <div className="profile-detail__body">
          <h1 className="auth-screen__title">
            {profile.display_name ?? "DateZA member"}
            {profile.age ? `, ${profile.age}` : ""}
          </h1>
          {profile.verified ? <p className="profile-detail__badge">Verified</p> : null}
          {location ? <p className="profile-detail__location">{location}</p> : null}
          {profile.bio ? <p className="auth-screen__intro">{profile.bio}</p> : null}
          {profile.prompts.map((prompt) => (
            <div className="profile-detail__prompt" key={prompt.key}>
              <p className="profile-detail__prompt-text">{prompt.prompt}</p>
              <p className="profile-detail__prompt-answer">{prompt.answer}</p>
            </div>
          ))}
          <button
            className="auth-form__submit"
            type="button"
            disabled={liked}
            onClick={() => {
              setLiked(true);
              void likeProfile(profile.id).catch(() => setLiked(false));
            }}
          >
            {liked ? "Liked" : "Like"}
          </button>
        </div>
      </article>
    </div>
  );
}
