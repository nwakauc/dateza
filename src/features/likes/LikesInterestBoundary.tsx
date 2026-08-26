import { HeartIcon } from "../shell/icons.tsx";
import { LikesEmptyState } from "./LikesEmptyState.tsx";

type Props = {
  tab: "liked_you" | "you_liked";
  onShowMutual: () => void;
  compact?: boolean;
};

export function LikesInterestBoundary({ tab, onShowMutual, compact = false }: Props) {
  if (tab === "liked_you") {
    return (
      <section className={`likes-section${compact ? " likes-section--compact" : ""}`} aria-labelledby="likes-incoming-heading">
        <div className="likes-section__heading">
          <h2 id="likes-incoming-heading">People who liked you</h2>
          <p>These members are interested in you. Like them back to match.</p>
        </div>
        {compact ? (
          <p className="likes-section__note">Incoming likes aren’t listed yet. Like someone who likes you and you’ll match.</p>
        ) : (
          <LikesEmptyState
            icon={<HeartIcon className="shell-empty__icon" filled={false} />}
            title="Incoming likes aren’t available yet"
            body="DateZA can’t show who liked you until that list exists. Keep discovering — if you like someone who already likes you, you’ll match."
            actions={[
              { to: "/discover", label: "Discover people" },
              { to: "/find", label: "Browse Find", subtle: true },
            ]}
          />
        )}
      </section>
    );
  }

  return (
    <section className={`likes-section${compact ? " likes-section--compact" : ""}`} aria-labelledby="likes-outgoing-heading">
      <div className="likes-section__heading">
        <h2 id="likes-outgoing-heading">You liked</h2>
        <p>People you’ve already chosen.</p>
      </div>
      {compact ? (
        <p className="likes-section__note">Sent likes aren’t listed yet. Reciprocal likes appear under Mutual.</p>
      ) : (
        <div className="shell-empty likes-empty">
          <HeartIcon className="shell-empty__icon" filled={false} />
          <p className="shell-empty__title">Your sent likes aren’t listed yet</p>
          <p className="shell-empty__body">
            DateZA doesn’t have a sent-likes list yet. If someone liked you back, they appear under Mutual.
          </p>
          <div className="likes-empty__actions">
            <button className="shell-primary-action" type="button" onClick={onShowMutual}>
              See mutual likes
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
