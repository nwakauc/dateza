import { describe, expect, it, vi } from "vitest";
import { apiRequest } from "./client.ts";
import { getCsrfToken, setCsrfToken } from "./csrfStore.ts";
import { getBearerToken, setBearerToken } from "./tokenStore.ts";

/**
 * D8N browser-session integration: every request must carry
 * `credentials: "include"` (the HttpOnly cookie is the real credential),
 * and unsafe requests must carry the in-memory CSRF token when one is held
 * — but never invent one, and never send it on GET/HEAD.
 */

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiRequest credentials and CSRF handling", () => {
  it("keeps API traffic same-origin and includes credentials", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiRequest("/api/v1/me");

    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe("/api/v1/me");
    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(init?.credentials).toBe("include");
  });

  it("does not attach X-CSRF-Token when no token is held, even for POST", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiRequest("/api/v1/conversations/c1/messages", { method: "POST", body: "{}" });

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.has("X-CSRF-Token")).toBe(false);
  });

  it("attaches X-CSRF-Token on unsafe methods when a token is held", async () => {
    setCsrfToken("csrf-abc");
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(jsonResponse(200, { ok: true })));

    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      vi.mocked(fetch).mockClear();
      await apiRequest("/api/v1/profile", { method });
      const init = vi.mocked(fetch).mock.calls[0]?.[1];
      const headers = new Headers(init?.headers);
      expect(headers.get("X-CSRF-Token")).toBe("csrf-abc");
    }
  });

  it("does not attach X-CSRF-Token on a GET, even when a token is held", async () => {
    setCsrfToken("csrf-abc");
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { ok: true }));

    await apiRequest("/api/v1/me");

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.has("X-CSRF-Token")).toBe(false);
  });

  it("clears both the bearer token and the CSRF token on a 401", async () => {
    setBearerToken("opaque-session-token");
    setCsrfToken("csrf-abc");
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { error: "session_expired" }));

    await expect(apiRequest("/api/v1/me")).rejects.toThrow();

    expect(getBearerToken()).toBeUndefined();
    expect(getCsrfToken()).toBeUndefined();
  });

  it("leaves bearer/CSRF state untouched on a 401 when invalidateOnUnauthorized is false", async () => {
    setBearerToken("opaque-session-token");
    setCsrfToken("csrf-abc");
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { error: "invalid_credentials" }));

    await expect(
      apiRequest("/api/v1/auth/password/login", { method: "POST" }, { invalidateOnUnauthorized: false }),
    ).rejects.toThrow();

    expect(getBearerToken()).toBe("opaque-session-token");
    expect(getCsrfToken()).toBe("csrf-abc");
  });
});
