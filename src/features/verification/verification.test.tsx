import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { MeResponse } from "../../lib/api/types.ts";
import { setBearerToken } from "../../lib/api/tokenStore.ts";
import { SessionContext } from "../session/SessionContext.ts";
import type { VerificationState } from "../session/verificationState.ts";
import { Modal } from "./Modal.tsx";
import { OtpInput } from "./OtpInput.tsx";
import { VerificationFlow } from "./VerificationFlow.tsx";

const unverified: VerificationState = {
  status: "known",
  kind: "email",
  verified: false,
  maskedDestination: "a••@example.com",
  codeDispatched: true,
  resendAvailableIn: 0,
};

const unverifiedPhone: VerificationState = {
  status: "known",
  kind: "phone",
  verified: false,
  maskedDestination: "+27 ••• 4567",
  codeDispatched: true,
  resendAvailableIn: 0,
};

const sessionUser: MeResponse = {
  user_id: 42,
  brand: { slug: "dateza", name: "DateZA" },
  session: { id: 7, expires_at: "2026-12-01T00:00:00Z" },
  identifier: { kind: "email", verified: false, masked_destination: "a••@example.com" },
  verification_required: true,
  verification: { code_dispatched: true, resend_available_in: 0 },
};

function jsonResponse(status: number, body: unknown, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function methodOf(init?: RequestInit): string {
  return init?.method ?? "GET";
}

function renderFlow(refreshSession = vi.fn(async () => undefined), onDone = vi.fn(), verification = unverified) {
  function Harness({ children }: { children: ReactNode }) {
    const [verificationState, setVerification] = useState(verification);
    return (
      <SessionContext.Provider
        value={{
          session: { status: "authenticated", user: sessionUser },
          verification: verificationState,
          setVerification,
          refreshSession,
        }}
      >
        {children}
      </SessionContext.Provider>
    );
  }

  setBearerToken("opaque-session-token");
  render(
    <MemoryRouter>
      <Harness>
        <VerificationFlow onDone={onDone} />
      </Harness>
    </MemoryRouter>,
  );
  return { refreshSession, onDone };
}

function enterCode(code = "123456") {
  fireEvent.change(screen.getByLabelText(/verification code, digit 1/i), { target: { value: code } });
}

describe("identifier verification recovery", () => {
  it("keeps an ordinary wrong code distinct and does not resend", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, { error: "verification_code_invalid" }));
    renderFlow();

    enterCode();
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That code isn't right.");
    expect(screen.getByRole("alert")).toHaveTextContent("Check the code and try again.");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(methodOf(vi.mocked(fetch).mock.calls[0]?.[1])).toBe("PATCH");
    expect(screen.getByLabelText(/digit 1/i)).toHaveValue("1");
  });

  it("automatically requests a replacement after an explicit expiry", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(410, { error: "verification_code_expired" }))
      .mockResolvedValueOnce(jsonResponse(202, { message: "sent", resend_available_in: 60 }));
    renderFlow();

    enterCode("654321");
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That code has expired.");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We sent you a new verification code. Enter the new code to continue.",
    );
    expect(screen.getByRole("button", { name: /resend code in 60s/i })).toBeDisabled();
    expect(screen.getByLabelText(/digit 1/i)).toHaveValue("");
    await waitFor(() => expect(screen.getByLabelText(/digit 1/i)).toHaveFocus());
    expect(vi.mocked(fetch).mock.calls.map((call) => methodOf(call[1]))).toEqual(["PATCH", "POST"]);
  });

  it("uses the authoritative wait when expiry recovery is throttled", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(410, { error: "verification_code_expired" }))
      .mockResolvedValueOnce(
        jsonResponse(429, { error: "verification_resend_too_soon" }, { "Retry-After": "24" }),
      );
    renderFlow();

    enterCode();
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That code has expired.");
    expect(screen.getByRole("alert")).toHaveTextContent("You can request a new code in 24 seconds.");
    expect(screen.queryByText(/we sent you a new verification code/i)).not.toBeInTheDocument();
  });

  it("never presents a network or server failure as a wrong code", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));
    renderFlow();

    enterCode();
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't verify your code.");
    expect(screen.getByRole("alert")).toHaveTextContent("Please try again.");
    expect(screen.queryByText(/isn't right/i)).not.toBeInTheDocument();
  });

  it("uses the recoverable generic state for a 5xx verification failure", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(jsonResponse(503, { error: "service_unavailable" }));
    renderFlow();

    enterCode();
    await user.click(screen.getByRole("button", { name: /verify email/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't verify your code.");
    expect(screen.getByRole("alert")).toHaveTextContent("Please try again.");
    expect(screen.queryByText(/isn't right/i)).not.toBeInTheDocument();
  });

  it("lets an email member correct a typo before verifying", async () => {
    const user = userEvent.setup();
    const refreshSession = vi.fn(async () => undefined);
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(202, { message: "sent", resend_available_in: 0 }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          identifier: { kind: "email", verified: true },
          revoked_session_count: 0,
        }),
      );
    renderFlow(refreshSession);

    await user.click(screen.getByRole("button", { name: /wrong email\?/i }));
    await user.type(screen.getByLabelText(/^email address$/i), "fixed@example.co.za");
    await user.type(screen.getByLabelText(/^password$/i), "secret12");
    await user.click(screen.getByRole("button", { name: /send code to new email/i }));

    expect(await screen.findByText(/fixed@example\.co\.za/i)).toBeInTheDocument();
    enterCode("654321");
    await user.click(screen.getByRole("button", { name: /confirm email/i }));

    expect(await screen.findByRole("heading", { name: /email verified/i })).toBeInTheDocument();
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls.map((call) => methodOf(call[1]))).toEqual(["POST", "PATCH"]);
  });

  it("lets a phone member correct a typo before verifying", async () => {
    const user = userEvent.setup();
    const refreshSession = vi.fn(async () => undefined);
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(202, { message: "sent" }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          identifier: { kind: "phone", verified: true },
          revoked_session_count: 0,
        }),
      );
    renderFlow(refreshSession, vi.fn(), unverifiedPhone);

    await user.click(screen.getByRole("button", { name: /wrong number\?/i }));
    await user.type(screen.getByLabelText(/^phone number$/i), "+27821234567");
    await user.type(screen.getByLabelText(/^password$/i), "secret12");
    await user.click(screen.getByRole("button", { name: /send code to new number/i }));

    expect(await screen.findByText(/\+27821234567/i)).toBeInTheDocument();
    enterCode("654321");
    await user.click(screen.getByRole("button", { name: /confirm number/i }));

    expect(await screen.findByRole("heading", { name: /phone verified/i })).toBeInTheDocument();
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(fetch).mock.calls.some(
        (call) => String(call[0]).endsWith("/api/v1/auth/phone/change") && methodOf(call[1]) === "POST",
      ),
    ).toBe(true);
    expect(
      vi.mocked(fetch).mock.calls.some(
        (call) => String(call[0]).endsWith("/api/v1/auth/phone/change") && methodOf(call[1]) === "PATCH",
      ),
    ).toBe(true);
  });

  it("prevents duplicate verification and refreshes the member after success", async () => {
    const user = userEvent.setup();
    let resolveRequest: ((response: Response) => void) | undefined;
    vi.mocked(fetch).mockImplementation(() => new Promise((resolve) => { resolveRequest = resolve; }));
    const refreshSession = vi.fn(async () => undefined);
    renderFlow(refreshSession);

    enterCode();
    const verify = screen.getByRole("button", { name: /verify email/i });
    await user.dblClick(verify);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    resolveRequest?.(jsonResponse(200, { identifier: { kind: "email", verified: true } }));
    expect(await screen.findByRole("heading", { name: /email verified/i })).toBeInTheDocument();
    expect(refreshSession).toHaveBeenCalledTimes(1);
  });
});

describe("segmented OTP interaction", () => {
  function Segmented() {
    const [value, setValue] = useState("");
    return <OtpInput value={value} onChange={setValue} label="Verification code" />;
  }

  it("distributes a pasted code, advances focus, and moves back on backspace", async () => {
    const user = userEvent.setup();
    render(<Segmented />);
    const first = screen.getByLabelText(/digit 1/i);
    fireEvent.change(first, { target: { value: "12 34-56" } });

    expect(screen.getAllByRole("textbox").map((input) => (input as HTMLInputElement).value)).toEqual([
      "1", "2", "3", "4", "5", "6",
    ]);
    expect(screen.getByLabelText(/digit 6/i)).toHaveFocus();

    await user.clear(screen.getByLabelText(/digit 6/i));
    await user.keyboard("{Backspace}");
    expect(screen.getByLabelText(/digit 5/i)).toHaveFocus();
  });

  it("traps focus in the modal, makes the background inert, and restores focus", async () => {
    const user = userEvent.setup();
    const appRoot = document.createElement("div");
    appRoot.id = "root";
    const opener = document.createElement("button");
    opener.textContent = "Open verification";
    appRoot.append(opener);
    document.body.append(appRoot);
    opener.focus();

    const { unmount } = render(
      <Modal ariaLabel="Verify your email" onClose={() => undefined}>
        <Segmented />
        <button type="button">Verify email</button>
      </Modal>,
    );

    expect(appRoot.inert).toBe(true);
    expect(screen.getByLabelText(/digit 1/i)).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: /close/i })).toHaveFocus();

    unmount();
    expect(appRoot.inert).toBe(false);
    expect(opener).toHaveFocus();
    appRoot.remove();
  });
});
