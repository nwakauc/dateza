import type { ComponentType } from "react";
import { ChatIcon, CompassIcon, HeartIcon, SearchIcon, UserIcon, type IconProps } from "./icons.tsx";

export type NavKey = "discover" | "find" | "likes" | "chats" | "profile";

export type NavItem = {
  key: NavKey;
  label: string;
  to: string;
  icon: ComponentType<IconProps>;
};

/** The five primary, always-present destinations — identical set on desktop
 * top nav and the mobile bottom tab bar so the app never feels like two
 * different products depending on viewport. */
export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { key: "discover", label: "Discover", to: "/discover", icon: CompassIcon },
  { key: "find", label: "Find", to: "/find", icon: SearchIcon },
  { key: "likes", label: "Likes", to: "/likes", icon: HeartIcon },
  { key: "chats", label: "Chats", to: "/chats", icon: ChatIcon },
  { key: "profile", label: "Profile", to: "/profile", icon: UserIcon },
];

/** Settings, Safety, and Upgrade are reached from Profile but aren't nested
 * under /profile in the URL, so NavLink's own isActive match misses them —
 * this keeps the Profile tab visually current while a member is anywhere in
 * their account area. */
const PROFILE_AREA_PREFIXES = ["/profile", "/settings", "/safety", "/upgrade"];

export function isProfileAreaPath(pathname: string): boolean {
  return PROFILE_AREA_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
