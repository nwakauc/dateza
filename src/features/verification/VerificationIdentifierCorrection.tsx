import { useId, useRef, useState, type FormEvent } from "react";
import {
  confirmEmailChange,
  confirmPhoneChange,
  requestEmailChange,
  requestPhoneChange,
} from "../../lib/api/auth.ts";
import type { IdentifierKind } from "../../lib/api/types.ts";
import { PasswordField } from "../auth/PasswordField.tsx";
import { identifierChangeErrorMessage } from "./identifierChangeErrors.ts";
import { OtpInput, type OtpInputHandle } from "./OtpInput.tsx";

type Props = {
  kind: IdentifierKind;
  onBack: () => void;
  onVerified: () => Promise<void>;
};

export function VerificationIdentifierCorrection({ kind, onBack, onVerified }: Props) {
  const identifierId = useId();
  const errorId = useId();
  const otpRef = useRef<OtpInputHandle>(null);
  const [phase, setPhase] = useState<"form" | "confirm">("form");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const proposedIdentifier = identifier.trim();
  const noun = kind === "email" ? "email" : "phone number";

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !proposedIdentifier || !password) return;
    setPending(true);
    setError(undefined);
    try {
      if (kind === "email") {
        await requestEmailChange(proposedIdentifier, password);
      } else {
        await requestPhoneChange(proposedIdentifier, password);
      }
      setPhase("confirm");
      setCode("");
      window.requestAnimationFrame(() => otpRef.current?.focusFirst());
    } catch (caught) {
      setError(
        identifierChangeErrorMessage(
          caught,
          kind === "email"
            ? "We couldn't update your email. Check the details and try again."
            : "We couldn't update your phone number. Check the details and try again.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  async function submitConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || code.length !== 6 || !proposedIdentifier) return;
    setPending(true);
    setError(undefined);
    try {
      if (kind === "email") {
        await confirmEmailChange(proposedIdentifier, code);
      } else {
        await confirmPhoneChange(proposedIdentifier, code);
      }
      await onVerified();
    } catch (caught) {
      setError(identifierChangeErrorMessage(caught, "We couldn't confirm that code. Check it and try again."));
    } finally {
      setPending(false);
    }
  }

  if (phase === "confirm") {
    return (
      <div className="verify-prompt">
        <p className="verify-prompt__eyebrow">Confirm your {noun}</p>
        <h2 className="verify-prompt__title">Enter the code for your new {noun}</h2>
        <p className="verify-prompt__body">
          We sent a 6-digit code to <strong translate="no">{proposedIdentifier}</strong>
        </p>
        <form className="auth-form verify-code-form" onSubmit={(event) => void submitConfirm(event)}>
          {error ? (
            <p className="auth-form__error" id={errorId} role="alert">
              {error}
            </p>
          ) : null}
          <OtpInput
            ref={otpRef}
            value={code}
            onChange={setCode}
            disabled={pending}
            label="Verification code"
            describedBy={error ? errorId : undefined}
          />
          <button className="auth-form__submit" type="submit" disabled={pending || code.length !== 6}>
            {pending ? "Confirming…" : kind === "email" ? "Confirm email" : "Confirm number"}
          </button>
          <button
            className="verify-prompt__secondary"
            type="button"
            onClick={() => {
              setPhase("form");
              setCode("");
              setError(undefined);
            }}
            disabled={pending}
          >
            Edit {noun}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="verify-prompt">
      <p className="verify-prompt__eyebrow">Fix your {noun}</p>
      <h2 className="verify-prompt__title">Use a different {noun}</h2>
      <p className="verify-prompt__body">
        Enter the {noun} you meant to use and your DateZA password. We’ll send a code there to confirm it.
      </p>
      <form className="auth-form verify-code-form" onSubmit={(event) => void submitRequest(event)}>
        {error ? (
          <p className="auth-form__error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
        <div className="auth-field">
          <label htmlFor={identifierId}>{kind === "email" ? "Email address" : "Phone number"}</label>
          <input
            id={identifierId}
            name={kind === "email" ? "email" : "phone"}
            type={kind === "email" ? "email" : "text"}
            inputMode={kind === "email" ? "email" : "tel"}
            autoComplete={kind === "email" ? "email" : "tel"}
            placeholder={kind === "email" ? "you@example.co.za" : "+27 82 123 4567"}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            disabled={pending}
            required
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <PasswordField
          label="Password"
          name="current_password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          disabled={pending}
          describedBy={error ? errorId : undefined}
        />
        <button className="auth-form__submit" type="submit" disabled={pending || !proposedIdentifier || !password}>
          {pending ? "Sending code…" : kind === "email" ? "Send code to new email" : "Send code to new number"}
        </button>
        <button className="verify-prompt__secondary" type="button" onClick={onBack} disabled={pending}>
          Back to verification
        </button>
      </form>
    </div>
  );
}
