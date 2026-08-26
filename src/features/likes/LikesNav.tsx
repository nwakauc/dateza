import { HeartIcon } from "../shell/icons.tsx";
import { LIKES_TAB_ITEMS, type LikesTab } from "./likesTabs.ts";

type Props = {
  active: LikesTab;
  mutualCount: number | undefined;
  onChange: (tab: LikesTab) => void;
};

export function LikesNav({ active, mutualCount, onChange }: Props) {
  return (
    <nav className="likes-nav" aria-label="Likes">
      {LIKES_TAB_ITEMS.map((tab) => {
        const count = tab.id === "mutual" || tab.id === "all" ? mutualCount : undefined;
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
