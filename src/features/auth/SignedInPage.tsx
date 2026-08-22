import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../session/useSession.ts";
import { useSignOut } from "./useSignOut.ts";

export default function SignedInPage() {
  const { session } = useSession();
  const { signOut, pending } = useSignOut();

  useEffect(() => {
    document.title = "Signed in — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who gets you.";
    };
  }, []);

  const brandName =
    session.status === "authenticated" ? session.user.brand.name : "DateZA";

  return (
    <main className="auth-screen" id="main-content">
      <div className="auth-screen__panel">
        <p className="auth-screen__eyebrow">You are signed in</p>
        <h1 className="auth-screen__title">Welcome to {brandName}</h1>
        <p className="auth-screen__intro">
          Profile setup is next. Refreshing this browser tab signs you out until
          DateZA has an approved way to keep a session.
        </p>
        <div className="auth-signed-in-actions">
          <button
            className="auth-form__submit"
            type="button"
            onClick={() => void signOut()}
            disabled={pending}
          >
            {pending ? "Signing out…" : "Sign out"}
          </button>
          <Link className="auth-screen__text-link" to="/">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
