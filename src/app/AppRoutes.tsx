import { Route, Routes } from "react-router-dom";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage.tsx";
import { GuestRoute } from "../features/auth/GuestRoute.tsx";
import ResetPasswordPage from "../features/auth/ResetPasswordPage.tsx";
import SignedInPage from "../features/auth/SignedInPage.tsx";
import SignInPage from "../features/auth/SignInPage.tsx";
import SignUpPage from "../features/auth/SignUpPage.tsx";
import { ProtectedRoute } from "../features/session/ProtectedRoute.tsx";
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
        path="/signed-in"
        element={
          <ProtectedRoute>
            <SignedInPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
