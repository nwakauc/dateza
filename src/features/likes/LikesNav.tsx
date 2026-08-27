import { HeartIcon } from "../shell/icons.tsx";
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

export function LikesNav({ active, incomingCount, outgoingCount, mutualCount, onChange }: Props) {
  return (
    <nav className="likes-nav" aria-label="Likes">
      {LIKES_TAB_ITEMS.map((tab) => {
        const count = countFor(tab.id, incomingCount, outgoingCount, mutualCount);
        return (
          <button
            key={tab.id}
            type="button"
            className={`likes-nav__item${active === tab.id ? " likes-nav__item--active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            <HeartIcon className="likes-nav__icon" filled={tab.id !== "liked_you"} />
            {tab.id === "mutual" ? "Mutual likes" : tab.id === "all" ? "All likes" : tab.label}
            {count != null ? <span className="likes-nav__count">{count}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
