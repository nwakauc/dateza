import { createContext } from "react";
import type { OwnerProfile, ProfileOnboardingStatus } from "../../lib/api/profileTypes.ts";

export type OwnAccount = {
  loading: boolean;
  profile: OwnerProfile | null;
  onboarding: ProfileOnboardingStatus | null;
  avatarUrl: string | null;
  photoCount: number;
  displayName: string;
  initial: string;
  unreadNotifications: number;
  refresh: () => void;
};

export const OwnAccountContext = createContext<OwnAccount | null>(null);
