import type { ComponentType } from "react";
import { ChatIcon, CompassIcon, HeartIcon, SearchIcon, type IconProps } from "./icons.tsx";

export type NavKey = "discover" | "find" | "likes" | "chats";

export type NavItem = {
  key: NavKey;
  label: string;
  to: string;
  icon: ComponentType<IconProps>;
};

/** The four dating destinations — identical on desktop and mobile so the app
 * never feels like two
 * different products depending on viewport. */
export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { key: "discover", label: "Discover", to: "/discover", icon: CompassIcon },
  { key: "find", label: "Find", to: "/find", icon: SearchIcon },
  { key: "likes", label: "Likes", to: "/likes", icon: HeartIcon },
  { key: "chats", label: "Chats", to: "/chats", icon: ChatIcon },
];
