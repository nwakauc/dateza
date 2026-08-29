import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import HqShell from "../features/hq/HqShell.tsx";
import { HqProtectedRoute } from "../features/hq/HqProtectedRoute.tsx";
import CommandCentrePage from "../features/hq/pages/CommandCentrePage.tsx";
import Member360Page from "../features/hq/pages/Member360Page.tsx";
import MemberSearchPage from "../features/hq/pages/MemberSearchPage.tsx";
import UnavailableHqPage from "../features/hq/pages/UnavailableHqPage.tsx";
import LandingPage from "../pages/LandingPage.tsx";
import {
  CareersPage,
  CitiesPage,
  DatingSafelyPage,
  GetTheAppPage,
  HelpPage,
  HowItWorksPage,
  LifestylePage,
  PrivacyPage,
  StoriesPage,
} from "../pages/public/MarketingPages.tsx";
import NotFoundPage from "./NotFoundPage.tsx";
function HqPlannedPage() {
  const location = useLocation();
  return <UnavailableHqPage path={location.pathname} />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/dating-safely" element={<DatingSafelyPage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/lifestyle" element={<LifestylePage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/cities" element={<CitiesPage />} />
      <Route path="/get-the-app" element={<GetTheAppPage />} />
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
        <Route
          path="/find"
          element={
            <RequireLocation>
              <FindPage />
            </RequireLocation>
          }
        />
        <Route path="/likes" element={<LikesPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/profile/photos" element={<Navigate to="/profile/edit#photos" replace />} />
        <Route path="/profile/:id" element={<ProfileDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/safety" element={<SafetyPage />} />
        <Route path="/safety" element={<Navigate to="/settings/safety" replace />} />
      </Route>

      {/* D8N HQ — internal command centre (Phase 1: shell + Member 360).
          Isolated visual/system from the consumer dating product. */}
      <Route
        path="/hq"
        element={
          <HqProtectedRoute>
            <HqShell />
          </HqProtectedRoute>
        }
      >
        <Route index element={<CommandCentrePage />} />
        <Route path="members" element={<MemberSearchPage />} />
        <Route path="members/:lookup" element={<Member360Page />} />
        <Route path="live" element={<UnavailableHqPage path="/hq/live" />} />
        <Route path="alerts" element={<UnavailableHqPage path="/hq/alerts" />} />
        <Route path="incidents" element={<UnavailableHqPage path="/hq/incidents" />} />
        <Route path="growth" element={<UnavailableHqPage path="/hq/growth" />} />
        <Route path="product" element={<UnavailableHqPage path="/hq/product" />} />
        <Route path="marketplace" element={<UnavailableHqPage path="/hq/marketplace" />} />
        <Route path="revenue" element={<UnavailableHqPage path="/hq/revenue" />} />
        <Route path="customers" element={<UnavailableHqPage path="/hq/customers" />} />
        <Route path="trust-safety" element={<UnavailableHqPage path="/hq/trust-safety" />} />
        <Route path="reliability" element={<UnavailableHqPage path="/hq/reliability" />} />
        <Route path="apm" element={<UnavailableHqPage path="/hq/apm" />} />
        <Route path="errors" element={<UnavailableHqPage path="/hq/errors" />} />
        <Route path="traces" element={<UnavailableHqPage path="/hq/traces" />} />
        <Route path="logs" element={<UnavailableHqPage path="/hq/logs" />} />
        <Route path="jobs" element={<UnavailableHqPage path="/hq/jobs" />} />
        <Route path="database" element={<UnavailableHqPage path="/hq/database" />} />
        <Route path="infrastructure" element={<UnavailableHqPage path="/hq/infrastructure" />} />
        <Route path="deployments" element={<UnavailableHqPage path="/hq/deployments" />} />
        <Route path="data-health" element={<UnavailableHqPage path="/hq/data-health" />} />
        <Route path="security" element={<UnavailableHqPage path="/hq/security" />} />
        <Route path="brands" element={<UnavailableHqPage path="/hq/brands" />} />
        <Route path="admin" element={<UnavailableHqPage path="/hq/admin" />} />
        <Route path="audit" element={<UnavailableHqPage path="/hq/audit" />} />
        <Route path="intelligence" element={<UnavailableHqPage path="/hq/intelligence" />} />
        <Route path="briefings" element={<UnavailableHqPage path="/hq/briefings" />} />
        <Route path="*" element={<HqPlannedPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
