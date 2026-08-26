import { LIKES_TAB_ITEMS, type LikesTab } from "./likesTabs.ts";

type Props = {
  active: LikesTab;
  mutualCount: number | undefined;
  onChange: (tab: LikesTab) => void;
};

export function LikesTabs({ active, mutualCount, onChange }: Props) {
  return (
    <div className="onboard-segmented likes-tabs" role="tablist" aria-label="Likes">
      {LIKES_TAB_ITEMS.map((tab) => {
        const selected = tab.id === active;
        const count = tab.id === "mutual" || tab.id === "all" ? mutualCount : undefined;
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
