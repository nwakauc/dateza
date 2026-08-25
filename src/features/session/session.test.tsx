import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute.tsx";
import { SessionProvider } from "./SessionProvider.tsx";
import { useSession } from "./useSession.ts";
import { getCsrfToken } from "../../lib/api/csrfStore.ts";
import { getBearerToken, setBearerToken } from "../../lib/api/tokenStore.ts";

const meBody = {
  user_id: 42,
  brand: { slug: "dateza", name: "DateZA" },
  session: { id: 7, expires_at: "2026-12-01T00:00:00Z" },
  identifier: { kind: "email", verified: true, masked_destination: "a••@example.com" },
  verification_required: false,
  verification: { code_dispatched: false, resend_available_in: 0 },
};

const cookieMeBody = {
  ...meBody,
  session: {
    id: 7,
    expires_at: "2026-12-01T00:00:00Z",
    authentication_mode: "cookie",
    csrf_token: "csrf-xyz",
  },
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function MemberArea() {
  return <h1>Member area</h1>;
}

function SessionProbe() {
  const { session, refreshSession } = useSession();
  return (
    <div>
      <p>status:{session.status}</p>
      <button type="button" onClick={() => void refreshSession()}>
        Refresh session
      </button>
    </div>
  );
}

function renderMemberRoute(path = "/member") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<h1>Public home</h1>} />
          <Route path="/sign-in" element={<h1>Sign in</h1>} />
          <Route
            path="/member"
            element={
              <ProtectedRoute>
                <MemberArea />
              </ProtectedRoute>
            }
          />
        </Routes>
        <SessionProbe />
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe("session bootstrap and protected routes", () => {
  it("does not expose protected content while session is unknown", () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => undefined));

    renderMemberRoute();

    expect(
      screen.getByRole("heading", { name: /checking your session/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /member area/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /public home/i }),
    ).not.toBeInTheDocument();
  });

  it("sends an unauthenticated member away from protected content", async () => {
    renderMemberRoute();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /sign in/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: /member area/i }),
    ).not.toBeInTheDocument();
  });

  it("allows protected content after a verified authenticated GET /api/v1/me", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, meBody));

    renderMemberRoute();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /member area/i }),
      ).toBeInTheDocument();
    });
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe(
      "https://dateza.test/api/v1/me",
    );
    const headers = new Headers(vi.mocked(fetch).mock.calls[0]?.[1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer opaque-session-token");
  });

  it("reconciles a later 401 to unauthenticated without keeping protected content", async () => {
    setBearerToken("opaque-session-token");
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(200, meBody))
      .mockResolvedValueOnce(jsonResponse(401, { error: "unauthorized" }));

    const user = userEvent.setup();
    renderMemberRoute();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /member area/i }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /refresh session/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /sign in/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: /member area/i }),
    ).not.toBeInTheDocument();
  });

  it("does not treat a network failure as authenticated", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    renderMemberRoute();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /temporarily unavailable/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: /member area/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("status:unavailable")).toBeInTheDocument();
  });

  it("bootstraps via the cookie alone — no bearer token in memory — and captures the CSRF token", async () => {
    // This is the refresh scenario the D8N browser-session integration
    // fixes: a fresh page load has no bearer token in memory at all, only
    // whatever HttpOnly cookie the browser is holding. `/me` must still be
    // able to authenticate (credentials included) and hand back a CSRF
    // token for subsequent unsafe requests.
    expect(getBearerToken()).toBeUndefined();
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, cookieMeBody));

    renderMemberRoute();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /member area/i }),
      ).toBeInTheDocument();
    });

    const init = vi.mocked(fetch).mock.calls[0]?.[1];
    expect(init?.credentials).toBe("include");
    const headers = new Headers(init?.headers);
    expect(headers.has("Authorization")).toBe(false);
    expect(getCsrfToken()).toBe("csrf-xyz");
  });
});
