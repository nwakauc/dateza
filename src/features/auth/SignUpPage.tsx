import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerWithPassword } from "../../lib/api/auth.ts";
import { AuthLayout } from "./AuthLayout.tsx";
import { PasswordField } from "./PasswordField.tsx";
import { signUpErrorMessage } from "./authErrors.ts";
import { useEstablishSession } from "./useEstablishSession.ts";

const PAGE_TITLE = "Create your DateZA account";

export default function SignUpPage() {
  const identifierId = useId();
  const errorId = useId();
  const navigate = useNavigate();
  const establishSession = useEstablishSession();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    document.title = `${PAGE_TITLE} — DateZA`;
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords don't match.");
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const trimmedIdentifier = identifier.trim();
      const session = await registerWithPassword(trimmedIdentifier, password);
      await establishSession(session);
      navigate("/discover", { replace: true });
    } catch (caught) {
      setError(signUpErrorMessage(caught));
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Join DateZA"
      intro="Create an account with your phone or email. Profile details come next."
    >
      <form className="auth-form" onSubmit={(event) => void onSubmit(event)} noValidate={false}>
        {error ? (
          <p className="auth-form__error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
        <div className="onboard-segmented" role="radiogroup" aria-label="Sign up with">
          <label className="onboard-segment" data-selected={method === "email" ? "true" : "false"}>
            <input
              type="radio"
              name="method"
              value="email"
              checked={method === "email"}
              disabled={pending}
              onChange={() => setMethod("email")}
            />
            Email
          </label>
          <label className="onboard-segment" data-selected={method === "phone" ? "true" : "false"}>
            <input
              type="radio"
              name="method"
              value="phone"
              checked={method === "phone"}
              disabled={pending}
              onChange={() => setMethod("phone")}
            />
            Phone
          </label>
        </div>
        <div className="auth-field">
          <label htmlFor={identifierId}>{method === "email" ? "Email address" : "Phone number"}</label>
          <input
            id={identifierId}
            name="identifier"
            type="text"
            inputMode={method === "email" ? "email" : "tel"}
            autoComplete="username"
            placeholder={method === "email" ? "you@example.co.za" : "+27 82 123 4567"}
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
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          disabled={pending}
          describedBy={error ? errorId : undefined}
        />
        <PasswordField
          label="Confirm password"
          name="password_confirmation"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          disabled={pending}
          describedBy={error ? errorId : undefined}
        />
        <p className="auth-form__hint">Use at least 6 characters.</p>
        <button className="auth-form__submit" type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="auth-screen__switch">
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
