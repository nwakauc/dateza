import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { listOwnerPhotos } from "../../lib/api/photos.ts";
import { getCurrentProfile } from "../../lib/api/profile.ts";
import type { OwnerProfile } from "../../lib/api/profileTypes.ts";
import { BottomTabBar } from "./BottomTabBar.tsx";
import { MobileHeader } from "./MobileHeader.tsx";
import { OwnAccountContext, type OwnAccount } from "./OwnAccountContext.ts";
import { TopNav } from "./TopNav.tsx";

function initialFor(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "D";
}

/**
 * The persistent authenticated shell: desktop top nav / mobile bottom tab
 * bar around every signed-in destination (Discover, Find, Likes, Chats,
 * Profile, and their secondary pages). Fetches the owner's profile + first
 * photo once here so nav, avatar, and Profile page all share one source
 * instead of each re-fetching.
 */
export default function AppShell() {
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCurrentProfile(), listOwnerPhotos()])
      .then(([profileResult, photos]) => {
        if (cancelled) return;
        setProfile(profileResult.profile);
        const withImage = photos.find((photo) => photo.image !== null);
        setAvatarUrl(withImage?.image?.url ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const displayName = profile?.display_name ?? "";
  const account: OwnAccount = {
    loading,
    profile,
    avatarUrl,
    displayName,
    initial: initialFor(displayName),
    refresh,
  };

  return (
    <OwnAccountContext.Provider value={account}>
      <div className="shell">
        <TopNav account={account} />
        <MobileHeader account={account} />
        <main className="shell-content" id="main-content">
          <Outlet />
        </main>
        <BottomTabBar />
      </div>
    </OwnAccountContext.Provider>
  );
}
