import { Navigate, useLocation } from "react-router-dom";
import { SessionStatusPage } from "../session/SessionStatusPage.tsx";
import { useSession } from "../session/useSession.ts";
import type { ReactNode } from "react";
import { HqStatusFrame } from "./HqStatusFrame.tsx";
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
      <HqStatusFrame>
        <SessionStatusPage
          title="Checking your session…"
          body="Please wait while D8N HQ confirms whether you are signed in."
          busy
        />
      </HqStatusFrame>
    );
  }

  if (session.status === "unavailable") {
    return (
      <HqStatusFrame>
        <SessionStatusPage
          title="D8N is temporarily unavailable"
          body="We could not confirm your session. Refresh the page and try again."
        />
      </HqStatusFrame>
    );
  }

  if (session.status === "unauthenticated") {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  }

  if (adminAccess === "unknown") {
    return (
      <HqStatusFrame>
        <SessionStatusPage
          title="Checking HQ access…"
          body="Confirming whether this account is an authorized operator for this brand."
          busy
        />
      </HqStatusFrame>
    );
  }

  if (adminAccess === "forbidden") {
    return (
      <HqStatusFrame>
        <SessionStatusPage
          title="HQ is for authorized operators"
          body="This account is signed in, but it does not have an active operator assignment for this brand."
        />
      </HqStatusFrame>
    );
  }

  if (adminAccess === "unavailable") {
    return (
      <HqStatusFrame>
        <SessionStatusPage
          title="Could not verify HQ access"
          body="Try again in a moment. If this keeps happening, refresh the page."
        />
      </HqStatusFrame>
    );
  }

  return children;
}
