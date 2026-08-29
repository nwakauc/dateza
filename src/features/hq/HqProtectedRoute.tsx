import { Navigate, useLocation } from "react-router-dom";
import { SessionStatusPage } from "../session/SessionStatusPage.tsx";
import { useSession } from "../session/useSession.ts";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

/** Session gate for /hq — same cookie/bearer session as the consumer app. */
export function HqProtectedRoute({ children }: Props) {
  const { session } = useSession();
  const location = useLocation();

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

  return children;
}
