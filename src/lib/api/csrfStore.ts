/**
 * In-memory holder for the D8N cookie-session CSRF token. Populated from a
 * successful `GET /api/v1/me` response when `session.authentication_mode`
 * is `"cookie"` (see types.ts MeResponse). The HttpOnly session cookie
 * itself is never readable from JS by design — this token is a separate,
 * non-secret value the server issues so the client can prove it is the
 * page that holds the cookie on unsafe requests.
 *
 * Memory-only, same as tokenStore.ts: never persisted to storage, and reset
 * on every full page load, at which point a fresh `/me` bootstrap supplies
 * a current token again.
 */

let csrfToken: string | undefined;

export function getCsrfToken(): string | undefined {
  return csrfToken;
}

export function setCsrfToken(token: string | undefined): void {
  csrfToken = token === "" ? undefined : token;
}
