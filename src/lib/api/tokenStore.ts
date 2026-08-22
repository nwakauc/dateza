/**
 * In-memory holder for the D8N opaque bearer token.
 * D8N issues Bearer sessions (OpenAPI securitySchemes.bearerAuth), not cookies.
 * Persistence is not approved (ADR-0002); do not write the token to storage or URLs.
 */

let bearerToken: string | undefined;

export function getBearerToken(): string | undefined {
  return bearerToken;
}

export function setBearerToken(token: string | undefined): void {
  bearerToken = token === "" ? undefined : token;
}
