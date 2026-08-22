import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  requestPasswordRecovery,
  verifyPasswordRecovery,
} from "../../lib/api/auth.ts";
import { AuthLayout } from "./AuthLayout.tsx";
import {
  recoveryRequestErrorMessage,
  recoveryVerifyErrorMessage,
} from "./authErrors.ts";
import type { ResetPasswordLocationState } from "./resetPasswordState.ts";

const NEUTRAL_FALLBACK =
  "If an eligible account exists, recovery instructions have been sent.";

export default function ForgotPasswordPage() {
  const identifierId = useId();
  const codeId = useId();
  const statusId = useId();
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "verify">("request");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();

  useEffect(() => {
    document.title = "Forgot password — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who gets you.";
    };
  }, []);

  async function onRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const result = await requestPasswordRecovery(identifier.trim());
      setNotice(result.message || NEUTRAL_FALLBACK);
      setStep("verify");
      setPending(false);
    } catch (caught) {
      setError(recoveryRequestErrorMessage(caught));
      setPending(false);
    }
  }

  async function onVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const authorization = await verifyPasswordRecovery(identifier.trim(), code.trim());
      const state: ResetPasswordLocationState = {
        resetToken: authorization.reset_token,
      };
      navigate("/reset-password", { replace: true, state });
    } catch (caught) {
      setError(recoveryVerifyErrorMessage(caught));
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      intro="Enter the phone or email on your account. We only send a code when that identifier can recover a DateZA password — the confirmation is the same either way."
    >
      {step === "request" ? (
        <form className="auth-form" onSubmit={(event) => void onRequest(event)}>
          {error ? (
            <p className="auth-form__error" id={statusId} role="alert">
              {error}
            </p>
          ) : null}
          <div className="auth-field">
            <label htmlFor={identifierId}>Phone or email</label>
            <input
              id={identifierId}
              name="identifier"
              type="text"
              inputMode="email"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              disabled={pending}
              required
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby={error ? statusId : undefined}
            />
          </div>
          <button className="auth-form__submit" type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send recovery instructions"}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={(event) => void onVerify(event)}>
          {notice ? (
            <p className="auth-form__notice" id={statusId} role="status">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="auth-form__error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="auth-field">
            <label htmlFor={codeId}>Recovery code</label>
            <input
              id={codeId}
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={pending}
              required
              spellCheck={false}
            />
          </div>
          <button className="auth-form__submit" type="submit" disabled={pending}>
            {pending ? "Checking…" : "Continue"}
          </button>
        </form>
      )}
      <p className="auth-screen__switch">
        Remembered it? <Link to="/sign-in">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
