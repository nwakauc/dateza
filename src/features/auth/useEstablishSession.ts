import { useCallback } from "react";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { useSession } from "../session/useSession.ts";

export function useEstablishSession() {
  const { refreshSession } = useSession();

  return useCallback(
    async (token: string) => {
      setBearerToken(token);
      await refreshSession();
    },
    [refreshSession],
  );
}
