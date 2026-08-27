import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { listOwnerPhotos } from "../../lib/api/photos.ts";
import { getCurrentProfile } from "../../lib/api/profile.ts";
import type { OwnerProfile, ProfileOnboardingStatus } from "../../lib/api/profileTypes.ts";
import { memberDestination } from "../onboarding/destination.ts";
import { useSession } from "../session/useSession.ts";
import { LiveSyncProvider } from "../liveSync/LiveSyncProvider.tsx";
import { Modal } from "../verification/Modal.tsx";
import { VerificationBanner } from "../verification/VerificationBanner.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
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
export default function AppShell({ children }: { children?: ReactNode }) {
  const { verification } = useSession();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [onboarding, setOnboarding] = useState<ProfileOnboardingStatus | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [version, setVersion] = useState(0);
  const promptedVerification = useRef<string | null>(null);
  const [verificationOpen, setVerificationOpen] = useState(false);

  const refresh = useCallback(() => setVersion((current) => current + 1), []);
  const closeVerification = useCallback(() => setVerificationOpen(false), []);

  // Verification must never outrank incomplete onboarding: only prompt once
  // onboarding is confirmed complete, so the OTP modal can't appear while a
  // member is mid-onboarding or before we've learned their onboarding state.
  useEffect(() => {
    if (onboarding?.state !== "complete") return;
    if (verification.status !== "known" || verification.verified) return;
    const key = `${verification.kind}:${verification.maskedDestination}`;
    if (promptedVerification.current === key) return;
    promptedVerification.current = key;
    setVerificationOpen(true);
  }, [verification, onboarding]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getCurrentProfile(), listOwnerPhotos()])
      .then(([profileResult, photosResult]) => {
        if (cancelled) return;
        if (profileResult.status === "fulfilled") {
          setProfile(profileResult.value.profile);
          setOnboarding(profileResult.value.onboarding);
        }
        if (photosResult.status === "fulfilled") {
          const photos = photosResult.value;
          setPhotoCount(photos.length);
          const withImage = photos.find((photo) => photo.image !== null);
          setAvatarUrl(withImage?.image?.url ?? null);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  // Onboarding must be complete before any app-shell destination (Discover,
  // Find, Likes, Chats, ...) mounts — this is the single guard for that
  // precedence, so individual pages don't each need their own redirect.
  // `onboarding` starts null while loading or on a failed fetch; in both
  // cases fall through and render as before rather than blocking the shell.
  if (onboarding) {
    const destination = memberDestination(onboarding);
    if (destination !== "/discover") {
      return <Navigate to={destination} replace />;
    }
  }

  const displayName = profile?.display_name ?? "";
  const account: OwnAccount = {
    loading,
    profile,
    onboarding,
    avatarUrl,
    photoCount,
    displayName,
    initial: initialFor(displayName),
    unreadNotifications,
    unreadChats,
    refresh,
  };

  return (
    <OwnAccountContext.Provider value={account}>
      <LiveSyncProvider refreshKey={version} onUnreadCount={setUnreadNotifications} onUnreadChats={setUnreadChats}>
        <div className="shell">
          <a className="shell-skip-link" href="#main-content">Skip to main content</a>
          <TopNav account={account} />
          <MobileHeader account={account} />
          <main className="shell-content" id="main-content">
            {verification.status === "known" && !verification.verified && !verificationOpen ? (
              <VerificationBanner kind={verification.kind} onVerify={() => setVerificationOpen(true)} />
            ) : null}
            {children ?? <Outlet />}
          </main>
          <BottomTabBar />
        </div>
        {verificationOpen && verification.status === "known" ? (
          <Modal ariaLabel={`Verify your ${verification.kind}`} onClose={closeVerification}>
            <VerificationFlow onDone={closeVerification} />
          </Modal>
        ) : null}
      </LiveSyncProvider>
    </OwnAccountContext.Provider>
  );
}
