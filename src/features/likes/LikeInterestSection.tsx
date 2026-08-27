import type { LikeListItem } from "../../lib/api/socialTypes.ts";
import type { OptionLabelLookup } from "../find/optionLabels.ts";
import { HeartIcon } from "../shell/icons.tsx";
import { LikesEmptyState } from "./LikesEmptyState.tsx";
import { LikesProfileCard } from "./LikesProfileCard.tsx";

type Kind = "incoming" | "outgoing";

type Props = {
  kind: Kind;
  likes: LikeListItem[];
  optionLabel: OptionLabelLookup;
  error?: boolean;
  nextCursor: string | null;
  loadingMore: boolean;
  likingId?: string;
  compact?: boolean;
  onRetry: () => void;
  onSeeMore: () => void;
  onLikeBack?: (item: LikeListItem) => void;
};

const COPY: Record<Kind, { headingId: string; title: string; intro: string; emptyTitle: string; emptyBody: string }> = {
  incoming: {
    headingId: "likes-incoming-heading",
    title: "People who liked you",
    intro: "These members are interested in you. Like them back to match.",
    emptyTitle: "No likes yet",
    emptyBody: "When someone likes you, they’ll appear here. Keep discovering — the right people are still finding you.",
  },
  outgoing: {
    headingId: "likes-outgoing-heading",
    title: "You liked",
    intro: "People you’ve already chosen. If they like you back, you’ll match.",
    emptyTitle: "You haven’t liked anyone yet",
    emptyBody: "Like someone who feels like a fit. If they like you back, you’ll match.",
  },
};

export function LikeInterestSection({
  kind,
  likes,
  optionLabel,
  error,
  nextCursor,
  loadingMore,
  likingId,
  compact = false,
  onRetry,
  onSeeMore,
  onLikeBack,
}: Props) {
  const copy = COPY[kind];

  if (error) {
    return (
      <section className={`likes-section${compact ? " likes-section--compact" : ""}`} aria-labelledby={copy.headingId}>
        <div className="likes-section__heading">
          <h2 id={copy.headingId}>{copy.title}</h2>
          <p>{copy.intro}</p>
        </div>
        <div className="shell-empty likes-empty">
          <HeartIcon className="shell-empty__icon" filled={false} />
          <p className="shell-empty__title">We couldn’t load this list</p>
          <p className="shell-empty__body">Check your connection, then try again.</p>
          <div className="likes-empty__actions">
            <button className="shell-primary-action" type="button" onClick={onRetry}>
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (likes.length === 0) {
    if (compact) {
      return (
        <section className="likes-section likes-section--compact" aria-labelledby={copy.headingId}>
          <div className="likes-section__heading">
            <h2 id={copy.headingId}>{copy.title}</h2>
            <p>{copy.intro}</p>
          </div>
          <p className="likes-section__note">{copy.emptyBody}</p>
        </section>
      );
    }
    return (
      <section className="likes-section" aria-labelledby={copy.headingId}>
        <div className="likes-section__heading">
          <h2 id={copy.headingId}>{copy.title}</h2>
          <p>{copy.intro}</p>
        </div>
        <LikesEmptyState
          icon={<HeartIcon className="shell-empty__icon" filled={false} />}
          title={copy.emptyTitle}
          body={copy.emptyBody}
          actions={[
            { to: "/discover", label: "Discover people" },
            { to: "/find", label: "Browse Find", subtle: true },
          ]}
        />
      </section>
    );
  }

  return (
    <section className={`likes-section${compact ? " likes-section--compact" : ""}`} aria-labelledby={copy.headingId}>
      <div className="likes-section__heading">
        <h2 id={copy.headingId}>{copy.title}</h2>
        <p>{copy.intro}</p>
      </div>
      <div className="likes-grid">
        {likes.map((item) => (
          <LikesProfileCard
            key={item.profile.id}
            profile={item.profile}
            optionLabel={optionLabel}
            kind={kind}
            compatibility={item.profile.compatibility}
            liking={likingId === item.profile.id}
            onLikeBack={kind === "incoming" && onLikeBack ? () => onLikeBack(item) : undefined}
          />
        ))}
      </div>
      {nextCursor ? (
        <button className="likes-more" type="button" onClick={onSeeMore} disabled={loadingMore}>
          {loadingMore ? "Loading…" : "See more"}
        </button>
      ) : null}
    </section>
  );
}
