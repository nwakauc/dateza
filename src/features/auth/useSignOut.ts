import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { revokeCurrentSession } from "../../lib/api/auth.ts";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { useSession } from "../session/useSession.ts";

export function useSignOut() {
  const { refreshSession } = useSession();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  const signOut = useCallback(async () => {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      await revokeCurrentSession();
    } catch {
      // Local credential is still cleared. A failed revoke leaves the server
      // session to expire; the user asked to leave this browser session.
    } finally {
      setBearerToken(undefined);
      await refreshSession();
      setPending(false);
      navigate("/", { replace: true });
    }
  }, [navigate, pending, refreshSession]);

  return { signOut, pending };
}
