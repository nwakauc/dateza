import { Navigate } from "react-router-dom";
import { SessionStatusPage } from "../session/SessionStatusPage.tsx";
import { useSession } from "../session/useSession.ts";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function GuestRoute({ children }: Props) {
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

  if (session.status === "authenticated") {
    return <Navigate to="/signed-in" replace />;
  }

  return children;
}
