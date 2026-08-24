import { createContext } from "react";
import type { OwnerProfile } from "../../lib/api/profileTypes.ts";

export type OwnAccount = {
  loading: boolean;
  profile: OwnerProfile | null;
  avatarUrl: string | null;
  displayName: string;
  initial: string;
  unreadNotifications: number;
  refresh: () => void;
};

export const OwnAccountContext = createContext<OwnAccount | null>(null);
