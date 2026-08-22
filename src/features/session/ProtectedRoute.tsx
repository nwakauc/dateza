import { Navigate } from "react-router-dom";
import { SessionStatusPage } from "./SessionStatusPage.tsx";
import { useSession } from "./useSession.ts";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const { session } = useSession();

  if (session.status === "unknown") {
    return (
      <SessionStatusPage
        title="Checking your session…"
        body="Please wait while DateZA confirms whether you are signed in."
        busy
      />
    );
  }

  if (session.status === "unavailable") {
    return (
      <SessionStatusPage
        title="DateZA is temporarily unavailable"
        body="We could not confirm your session. Refresh the page and try again."
      />
    );
  }

  if (session.status === "unauthenticated") {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}
