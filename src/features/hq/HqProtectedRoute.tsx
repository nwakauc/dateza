import { Navigate, useLocation } from "react-router-dom";
import { SessionStatusPage } from "../session/SessionStatusPage.tsx";
import { useSession } from "../session/useSession.ts";
import type { ReactNode } from "react";
import { useBrandAdminAccess } from "./useBrandAdminAccess.ts";

type Props = {
  children: ReactNode;
};

/** Session + brand-admin gate for /hq. Non-admins cannot enter by typing the URL. */
export function HqProtectedRoute({ children }: Props) {
  const { session } = useSession();
  const location = useLocation();
  const adminAccess = useBrandAdminAccess();

  if (session.status === "unknown") {
    return (
      <SessionStatusPage
        title="Checking your session…"
        body="Please wait while D8N HQ confirms whether you are signed in."
        busy
      />
    );
  }

  if (session.status === "unavailable") {
    return (
      <SessionStatusPage
        title="D8N is temporarily unavailable"
        body="We could not confirm your session. Refresh the page and try again."
      />
    );
  }

  if (session.status === "unauthenticated") {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  }

  if (adminAccess === "unknown") {
    return (
      <SessionStatusPage
        title="Checking HQ access…"
        body="Confirming whether this account can open D8N HQ for this brand."
        busy
      />
    );
  }

  if (adminAccess === "forbidden") {
    return (
      <SessionStatusPage
        title="HQ is for admins only"
        body="This account is signed in, but it is not an admin for this brand."
      />
    );
  }

  if (adminAccess === "unavailable") {
    return (
      <SessionStatusPage
        title="Could not verify HQ access"
        body="Try again in a moment. If this keeps happening, refresh the page."
      />
    );
  }

  return children;
}
