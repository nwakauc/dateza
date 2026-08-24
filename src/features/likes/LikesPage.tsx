import { useEffect, useState } from "react";
import { HeartIcon } from "../shell/icons.tsx";

type Segment = "likes_you" | "matches";

/**
 * DateZA has no "likes received" or "matches list" endpoint yet — liking a
 * profile from Find can already produce a match (see likeProfile() in
 * lib/api/find.ts), but there is nowhere to fetch the resulting list from.
 * This stays an honest placeholder, same spirit as DiscoveryPage, rather
 * than inventing fake likes/matches.
 */
export default function LikesPage() {
  const [segment, setSegment] = useState<Segment>("likes_you");

  useEffect(() => {
    document.title = "Likes — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  return (
    <div className="shell-page" id="main-content">
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Interest</p>
        <h1 className="shell-page__title">Likes</h1>
        <p className="shell-page__subtitle">
          People who liked you, and the matches you've made across Discover and Find.
        </p>
      </div>

      <div className="likes-tabs" role="tablist" aria-label="Likes">
        <button
          type="button"
          role="tab"
          aria-selected={segment === "likes_you"}
          className={`likes-tabs__button${segment === "likes_you" ? " likes-tabs__button--active" : ""}`}
          onClick={() => setSegment("likes_you")}
        >
          Likes you
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={segment === "matches"}
          className={`likes-tabs__button${segment === "matches" ? " likes-tabs__button--active" : ""}`}
          onClick={() => setSegment("matches")}
        >
          Matches
        </button>
      </div>

      <div className="shell-empty">
        <HeartIcon className="shell-empty__icon" filled={false} />
        {segment === "likes_you" ? (
          <>
            <p className="shell-empty__title">No likes yet</p>
            <p className="shell-empty__body">
              When someone on DateZA likes you, they'll show up here. Keep your profile and photos fresh to stand
              out on Discover and Find.
            </p>
          </>
        ) : (
          <>
            <p className="shell-empty__title">No matches yet</p>
            <p className="shell-empty__body">
              A match happens when you and someone else both like each other. Browse Discover or Find to get
              started.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
