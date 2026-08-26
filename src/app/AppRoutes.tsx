import { Navigate, Route, Routes } from "react-router-dom";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage.tsx";
import { GuestRoute } from "../features/auth/GuestRoute.tsx";
import ResetPasswordPage from "../features/auth/ResetPasswordPage.tsx";
import SignInPage from "../features/auth/SignInPage.tsx";
import SignUpPage from "../features/auth/SignUpPage.tsx";
import ChatsPage from "../features/chats/ChatsPage.tsx";
import DiscoveryPage from "../features/discovery/DiscoveryPage.tsx";
import { RequireLocation } from "../features/discovery/RequireLocation.tsx";
import FindPage from "../features/find/FindPage.tsx";
import ProfileDetailPage from "../features/find/ProfileDetailPage.tsx";
import LikesPage from "../features/likes/LikesPage.tsx";
import MemberHomePage from "../features/member/MemberHomePage.tsx";
import OnboardingPage from "../features/onboarding/OnboardingPage.tsx";
import NotificationsPage from "../features/notifications/NotificationsPage.tsx";
import EditProfilePage from "../features/profile/EditProfilePage.tsx";
import ProfilePage from "../features/profile/ProfilePage.tsx";
import SafetyPage from "../features/profile/SafetyPage.tsx";
import SettingsPage from "../features/profile/SettingsPage.tsx";
import { ProtectedRoute } from "../features/session/ProtectedRoute.tsx";
import AppShell from "../features/shell/AppShell.tsx";
import LandingPage from "../pages/LandingPage.tsx";
import NotFoundPage from "./NotFoundPage.tsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/sign-up"
        element={
          <GuestRoute>
            <SignUpPage />
          </GuestRoute>
        }
      />
      <Route
        path="/sign-in"
        element={
          <GuestRoute>
            <SignInPage />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPasswordPage />
          </GuestRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <MemberHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/signed-in"
        element={
          <ProtectedRoute>
            <MemberHomePage />
          </ProtectedRoute>
        }
      />

      {/* Authenticated product shell: four primary dating destinations plus
          profile, notifications, settings, and safety share the persistent
          top nav / bottom tab bar. */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route
          path="/discover"
          element={
            <RequireLocation>
              <DiscoveryPage />
            </RequireLocation>
          }
        />
        {/* Old path kept working — nothing outside this file should link
            here anymore, but a bookmarked/shared URL still lands safely. */}
        <Route path="/discovery" element={<Navigate to="/discover" replace />} />
        <Route path="/find" element={<FindPage />} />
        <Route path="/likes" element={<LikesPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/profile/photos" element={<Navigate to="/profile/edit#photos" replace />} />
        <Route path="/profile/:id" element={<ProfileDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/safety" element={<SafetyPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
