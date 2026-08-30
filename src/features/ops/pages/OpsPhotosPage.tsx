import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProfilePhotoQueue, hqErrorMessage, moderateProfilePhoto } from "../../../lib/hq/api.ts";
import type { HqProfilePhotoQueueEntry } from "../../../lib/hq/types.ts";
import { useHqOperator } from "../../hq/useHqOperator.ts";
import { OpsBanner, OpsEmpty } from "../components/OpsPrimitives.tsx";
import { opsCan } from "../opsCapabilities.ts";
import { formatWhen } from "../opsFormat.ts";

export default function OpsPhotosPage() {
  const { operator } = useHqOperator();
  const canModerate = opsCan(operator, "admin.profile_photos.moderate");
  const [photos, setPhotos] = useState<HqProfilePhotoQueueEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string>();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  useEffect(() => {
    if (!canModerate) {
      return;
    }
    let cancelled = false;
    void fetchProfilePhotoQueue()
      .then((queue) => {
        if (!cancelled) {
          setPhotos(queue.photos);
          setStatus("ready");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus("error");
          setMessage(hqErrorMessage(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [canModerate]);

  async function reload() {
    setStatus("loading");
    try {
      const queue = await fetchProfilePhotoQueue();
      setPhotos(queue.photos);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setMessage(hqErrorMessage(error));
    }
  }

  async function decide(photoId: string, decision: "approved" | "rejected") {
    setPendingId(photoId);
    setMessage(undefined);
    try {
      await moderateProfilePhoto(photoId, decision);
      setRejectId(null);
      await reload();
    } catch (error) {
      setMessage(hqErrorMessage(error));
    } finally {
      setPendingId(null);
    }
  }

  if (!canModerate) {
    return <OpsBanner tone="forbidden" title="Forbidden" body="You cannot access the photo moderation queue." />;
  }

  if (status === "loading") return <p className="ops-muted">Loading photo queue…</p>;

  if (status === "error") {
    return (
      <OpsBanner
        tone="error"
        title="Could not load queue"
        body={message ?? ""}
        action={
          <button type="button" className="ops-btn" onClick={() => void reload()}>
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div>
      {message ? <OpsBanner tone="error" title="Moderation failed" body={message} /> : null}
      {photos.length === 0 ? (
        <OpsEmpty title="Queue is empty" body="No pending profile photos need a decision on this brand." />
      ) : (
        <div className="ops-photo-grid">
          {photos.map((photo) => (
            <article className="ops-card ops-photo-card" key={photo.id}>
              {photo.image?.url ? (
                <img src={photo.image.url} alt="" />
              ) : (
                <div className="ops-muted" style={{ padding: 24, textAlign: "center" }}>
                  Preview not ready
                </div>
              )}
              <p className="ops-muted">
                Position {photo.position} · {formatWhen(photo.created_at)}
              </p>
              <Link className="ops-inline-link" to={`/ops/users/${encodeURIComponent(photo.profile_id)}`}>
                Open member
              </Link>
              <div className="ops-photo-card__actions">
                <button
                  type="button"
                  className="ops-btn ops-btn--primary"
                  disabled={pendingId === photo.id}
                  onClick={() => void decide(photo.id, "approved")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="ops-btn ops-btn--danger"
                  disabled={pendingId === photo.id}
                  onClick={() => setRejectId(photo.id)}
                >
                  Reject
                </button>
              </div>
              {rejectId === photo.id ? (
                <div style={{ marginTop: 8 }}>
                  <p className="ops-muted">Reject this photo? The placement will be hidden.</p>
                  <button
                    type="button"
                    className="ops-btn ops-btn--danger"
                    disabled={pendingId === photo.id}
                    onClick={() => void decide(photo.id, "rejected")}
                  >
                    Confirm reject
                  </button>
                  <button type="button" className="ops-btn" onClick={() => setRejectId(null)}>
                    Cancel
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
