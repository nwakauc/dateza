import { LIKES_TAB_ITEMS, type LikesTab } from "./likesTabs.ts";

type Props = {
  active: LikesTab;
  incomingCount: number | undefined;
  outgoingCount: number | undefined;
  mutualCount: number | undefined;
  onChange: (tab: LikesTab) => void;
};

function countFor(tab: LikesTab, incomingCount: number | undefined, outgoingCount: number | undefined, mutualCount: number | undefined): number | undefined {
  if (tab === "liked_you") return incomingCount;
  if (tab === "you_liked") return outgoingCount;
  if (tab === "mutual") return mutualCount;
  if (tab === "all" && incomingCount != null && outgoingCount != null && mutualCount != null) {
    return incomingCount + outgoingCount + mutualCount;
  }
  return undefined;
}

export function LikesTabs({ active, incomingCount, outgoingCount, mutualCount, onChange }: Props) {
  return (
    <div className="onboard-segmented likes-tabs" role="tablist" aria-label="Likes">
      {LIKES_TAB_ITEMS.map((tab) => {
        const selected = tab.id === active;
        const count = countFor(tab.id, incomingCount, outgoingCount, mutualCount);
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`likes-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`likes-panel-${tab.id}`}
            aria-label={count != null ? `${tab.label}, ${count}` : tab.label}
            className="onboard-segment likes-tabs__button"
            data-selected={selected ? "true" : "false"}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {count != null ? <span className="likes-tabs__count">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
