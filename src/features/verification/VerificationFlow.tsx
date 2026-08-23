import { useEffect, useId, useRef, useState } from "react";
import { requestIdentifierVerification, verifyIdentifier } from "../../lib/api/auth.ts";
import { ApiError } from "../../lib/api/errors.ts";
import { useSession } from "../session/useSession.ts";
import { maskIdentifier } from "./maskIdentifier.ts";
import { OtpInput } from "./OtpInput.tsx";
import { requestCodeErrorMessage, verifyCodeErrorMessage } from "./verificationErrors.ts";

type Step = "prompt" | "otp" | "success";

type Props = {
  /** Called when the flow should close (dismissed, or verification finished). */
  onDone: () => void;
};

const SUCCESS_DISPLAY_MS = 1100;

export function VerificationFlow({ onDone }: Props) {
  const { verification, setVerification } = useSession();
  const [step, setStep] = useState<Step>("prompt");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(0);
  const titleId = useId();
  const codeErrorId = useId();
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (step !== "success") {
      return;
    }
    const timer = setTimeout(onDone, SUCCESS_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [step, onDone]);

  if (verification.status !== "known") {
    return null;
  }

  const { kind, rawIdentifier } = verification;
  const masked = maskIdentifier(kind, rawIdentifier);
  const noun = kind === "email" ? "email" : "phone";

  function startCooldown(seconds: number) {
    setCooldown(seconds);
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
    }
    cooldownTimer.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (cooldownTimer.current) {
            clearInterval(cooldownTimer.current);
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function sendCode() {
    setPending(true);
    setError(undefined);
    try {
      await requestIdentifierVerification(kind);
      setStep("otp");
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 429) {
        setStep("otp");
        startCooldown(caught.retryAfterSeconds ?? 30);
        setError(undefined);
      } else {
        setError(requestCodeErrorMessage(caught));
      }
    } finally {
      setPending(false);
    }
  }

  async function resendCode() {
    if (cooldown > 0 || pending) {
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      await requestIdentifierVerification(kind);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 429) {
        startCooldown(caught.retryAfterSeconds ?? 30);
      } else {
        setError(requestCodeErrorMessage(caught));
      }
    } finally {
      setPending(false);
    }
  }

  async function submitCode() {
    if (code.length !== 6 || pending) {
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const result = await verifyIdentifier(kind, code);
      setVerification({ status: "known", kind: result.identifier.kind, verified: true, rawIdentifier });
      setStep("success");
    } catch (caught) {
      setCode("");
      setError(verifyCodeErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  if (step === "prompt") {
    return (
      <div className="verify-prompt">
        <h2 id={titleId} className="verify-prompt__title">
          Verify to start matching
        </h2>
        <p className="verify-prompt__body">
          Confirm your {noun} to like profiles, view full profiles and connect with people on DateZA.
        </p>
        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="verify-prompt__actions">
          <button className="auth-form__submit" type="button" onClick={() => void sendCode()} disabled={pending}>
            {pending ? "Sending…" : `Verify ${noun}`}
          </button>
          <button className="verify-prompt__secondary" type="button" onClick={onDone}>
            Not now
          </button>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="verify-prompt">
        <h2 id={titleId} className="verify-prompt__title">
          {kind === "email" ? "Check your email" : "Check your phone"}
        </h2>
        <p className="verify-prompt__body">
          We sent a 6-digit code to <strong>{masked}</strong>
        </p>
        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitCode();
          }}
        >
          {error ? (
            <p className="auth-form__error" id={codeErrorId} role="alert">
              {error}
            </p>
          ) : null}
          <OtpInput
            value={code}
            onChange={setCode}
            disabled={pending}
            label="Verification code"
            describedBy={error ? codeErrorId : undefined}
          />
          <button className="auth-form__submit" type="submit" disabled={pending || code.length !== 6}>
            {pending ? "Verifying…" : "Verify"}
          </button>
        </form>
        <div className="verify-prompt__actions verify-prompt__actions--row">
          <button
            className="verify-prompt__secondary"
            type="button"
            onClick={() => void resendCode()}
            disabled={pending || cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-prompt verify-prompt--success">
      <h2 id={titleId} className="verify-prompt__title">
        You&rsquo;re verified ✓
      </h2>
    </div>
  );
}
