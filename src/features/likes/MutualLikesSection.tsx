import type { Conversation, Match } from "../../lib/api/socialTypes.ts";
import type { OptionLabelLookup } from "../find/optionLabels.ts";
import { HeartIcon } from "../shell/icons.tsx";
import { LikesEmptyState } from "./LikesEmptyState.tsx";
import { LikesProfileCard } from "./LikesProfileCard.tsx";

type Props = {
  matches: Match[];
  conversationsByMatchId: Map<string, Conversation>;
  optionLabel: OptionLabelLookup;
  startingId?: string;
  nextCursor: string | null;
  loadingMore: boolean;
  onMessage: (match: Match) => void;
  onSeeMore: () => void;
};

export function MutualLikesSection({
  matches,
  conversationsByMatchId,
  optionLabel,
  startingId,
  nextCursor,
  loadingMore,
  onMessage,
  onSeeMore,
}: Props) {
  if (matches.length === 0) {
    return (
      <LikesEmptyState
        icon={<HeartIcon className="shell-empty__icon" filled={false} />}
        title="No matches yet"
        body="A match happens when you both like each other. Keep showing up — the right people are still finding you."
        actions={[
          { to: "/discover", label: "Discover people" },
          { to: "/profile/edit", label: "Improve your profile", subtle: true },
        ]}
      />
    );
  }

  return (
    <section className="likes-section" aria-labelledby="likes-mutual-heading">
      <div className="likes-section__heading">
        <h2 id="likes-mutual-heading">Mutual likes</h2>
        <p>You and these members like each other.</p>
      </div>
      <div className="likes-grid">
        {matches.map((match) => (
          <LikesProfileCard
            key={match.id}
            profile={match.profile}
            optionLabel={optionLabel}
            conversationId={conversationsByMatchId.get(match.id)?.id}
            messaging={startingId === match.id}
            onMessage={() => onMessage(match)}
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
