import { useEffect, useId, useRef, useState } from "react";
import { requestIdentifierVerification, verifyIdentifier } from "../../lib/api/auth.ts";
import { useSession } from "../session/useSession.ts";
import { OtpInput, type OtpInputHandle } from "./OtpInput.tsx";
import { VerificationIdentifierCorrection } from "./VerificationIdentifierCorrection.tsx";
import {
  requestCodeIssue,
  verificationIssue,
  type VerificationIssue,
} from "./verificationErrors.ts";

type Step = "prompt" | "otp" | "success";

type Props = {
  onDone: () => void;
};

const SUCCESS_DISPLAY_MS = 1100;

export function VerificationFlow({ onDone }: Props) {
  const { verification, setVerification, refreshSession } = useSession();
  const [step, setStep] = useState<Step>(() =>
    verification.status === "known" && verification.codeDispatched ? "otp" : "prompt",
  );
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [issue, setIssue] = useState<VerificationIssue>();
  const [notice, setNotice] = useState<string>();
  const [cooldown, setCooldown] = useState(() =>
    verification.status === "known" ? verification.resendAvailableIn : 0,
  );
  const [correcting, setCorrecting] = useState(false);
  const statusId = useId();
  const otpRef = useRef<OtpInputHandle>(null);
  const focusRequested = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step !== "success") return;
    const timer = window.setTimeout(onDone, SUCCESS_DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [step, onDone]);

  useEffect(() => {
    if (!focusRequested.current || pending || step !== "otp") return;
    focusRequested.current = false;
    const frame = window.requestAnimationFrame(() => otpRef.current?.focusFirst());
    return () => window.cancelAnimationFrame(frame);
  }, [pending, step]);

  if (verification.status !== "known") return null;

  const { kind, maskedDestination } = verification;
  const noun = kind === "email" ? "email" : "phone number";
  const correctionLabel = kind === "email" ? "Wrong email?" : "Wrong number?";

  if (correcting) {
    return (
      <VerificationIdentifierCorrection
        kind={kind}
        onBack={() => {
          setCorrecting(false);
          setIssue(undefined);
          setNotice(undefined);
        }}
        onVerified={async () => {
          await refreshSession();
          setCorrecting(false);
          setStep("success");
        }}
      />
    );
  }

  function updateCooldown(seconds: number | undefined) {
    if (seconds !== undefined) setCooldown(Math.max(0, seconds));
  }

  async function dispatchCode(reason: "initial" | "manual" | "expired") {
    try {
      const result = await requestIdentifierVerification(kind);
      setStep("otp");
      setCode("");
      setCooldown(result.resend_available_in);
      setVerification({
        status: "known",
        kind,
        verified: false,
        maskedDestination,
        codeDispatched: true,
        resendAvailableIn: result.resend_available_in,
      });
      setNotice(reason === "manual" ? "A new verification code has been sent." : undefined);
      setIssue(
        reason === "expired"
          ? {
              kind: "expired",
              title: "That code has expired.",
              body: "We sent you a new verification code. Enter the new code to continue.",
            }
          : undefined,
      );
      focusRequested.current = true;
    } catch (caught) {
      const next = requestCodeIssue(caught);
      updateCooldown(next.retryAfterSeconds);
      if (reason === "expired") {
        const waiting = next.kind === "resend_too_soon" || next.kind === "rate_limited";
        setIssue({
          kind: "expired",
          title: "That code has expired.",
          body: waiting
            ? "Wait for the countdown, then request a new verification code."
            : "Request a new verification code to continue.",
          retryAfterSeconds: waiting ? next.retryAfterSeconds : undefined,
        });
      } else {
        setIssue(next);
      }
      setNotice(undefined);
      focusRequested.current = true;
    }
  }

  async function sendCode() {
    if (pending) return;
    setPending(true);
    setIssue(undefined);
    setNotice(undefined);
    await dispatchCode("initial");
    setPending(false);
  }

  async function resendCode() {
    if (cooldown > 0 || pending) return;
    setPending(true);
    setIssue(undefined);
    setNotice(undefined);
    await dispatchCode("manual");
    setPending(false);
  }

  async function submitCode() {
    if (code.length !== 6 || pending) return;
    setPending(true);
    setIssue(undefined);
    setNotice(undefined);
    try {
      const result = await verifyIdentifier(kind, code);
      setVerification({
        status: "known",
        kind: result.identifier.kind,
        verified: true,
        maskedDestination,
        codeDispatched: false,
        resendAvailableIn: 0,
      });
      await refreshSession();
      setStep("success");
    } catch (caught) {
      const next = verificationIssue(caught);
      if (next.kind === "expired") {
        setCode("");
        await dispatchCode("expired");
      } else {
        setIssue(next);
        focusRequested.current = true;
      }
    } finally {
      setPending(false);
    }
  }

  if (step === "prompt") {
    return (
      <div className="verify-prompt">
        <p className="verify-prompt__eyebrow">One quick step</p>
        <h2 className="verify-prompt__title">Verify your {noun}</h2>
        <p className="verify-prompt__body">
          We’ll send a 6-digit code to <strong translate="no">{maskedDestination}</strong> so you can start
          connecting on DateZA.
        </p>
        <p className="verify-prompt__correction">
          <button className="verify-prompt__secondary" type="button" onClick={() => setCorrecting(true)} disabled={pending}>
            {correctionLabel}
          </button>
        </p>
        {issue ? <IssueMessage issue={issue} cooldown={cooldown} id={statusId} /> : null}
        <div className="verify-prompt__actions">
          <button className="auth-form__submit" type="button" onClick={() => void sendCode()} disabled={pending}>
            {pending ? "Sending…" : "Send verification code"}
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
        <p className="verify-prompt__eyebrow">Verify your {noun}</p>
        <h2 className="verify-prompt__title">Enter your code</h2>
        <p className="verify-prompt__body">
          We sent a 6-digit code to <strong translate="no">{maskedDestination}</strong>
        </p>
        <p className="verify-prompt__correction">
          <button className="verify-prompt__secondary" type="button" onClick={() => setCorrecting(true)} disabled={pending}>
            {correctionLabel}
          </button>
        </p>
        <form
          className="auth-form verify-code-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitCode();
          }}
        >
          {issue ? <IssueMessage issue={issue} cooldown={cooldown} id={statusId} /> : null}
          {notice ? (
            <p className="verify-status" id={statusId} role="status" aria-live="polite">
              {notice}
            </p>
          ) : null}
          <OtpInput
            ref={otpRef}
            value={code}
            onChange={setCode}
            disabled={pending}
            label="Verification code"
            describedBy={issue || notice ? statusId : undefined}
          />
          <button className="auth-form__submit" type="submit" disabled={pending || code.length !== 6}>
            {pending ? "Verifying…" : kind === "email" ? "Verify email" : "Verify phone number"}
          </button>
        </form>
        <div className="verify-resend">
          <span>Didn’t get the code?</span>
          <button
            className="verify-prompt__secondary"
            type="button"
            onClick={() => void resendCode()}
            disabled={pending || cooldown > 0}
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-prompt verify-prompt--success" role="status" aria-live="polite">
      <span className="verify-success-mark" aria-hidden="true">✓</span>
      <h2 className="verify-prompt__title">{kind === "email" ? "Email" : "Phone"} verified</h2>
      <p className="verify-prompt__body">You’re ready for the next step.</p>
    </div>
  );
}

function IssueMessage({ issue, cooldown, id }: { issue: VerificationIssue; cooldown: number; id: string }) {
  const body = issue.kind === "expired" && issue.retryAfterSeconds !== undefined && cooldown > 0
    ? `You can request a new code in ${cooldown} seconds.`
    : issue.body;

  return (
    <div className="verify-issue" id={id} role="alert" aria-live="assertive">
      <strong>{issue.title}</strong>
      <span>{body}</span>
    </div>
  );
}
