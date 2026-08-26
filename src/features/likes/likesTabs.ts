export type LikesTab = "all" | "liked_you" | "you_liked" | "mutual";

export function parseLikesTab(value: string | null): LikesTab {
  if (value === "liked_you" || value === "you_liked" || value === "mutual") return value;
  return "all";
}

export const LIKES_TAB_ITEMS: { id: LikesTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "liked_you", label: "Liked you" },
  { id: "you_liked", label: "You liked" },
  { id: "mutual", label: "Mutual" },
];
