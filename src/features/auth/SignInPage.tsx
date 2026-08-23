import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginWithPassword } from "../../lib/api/auth.ts";
import { AuthLayout } from "./AuthLayout.tsx";
import { PasswordField } from "./PasswordField.tsx";
import { signInErrorMessage } from "./authErrors.ts";
import { useEstablishSession } from "./useEstablishSession.ts";

export default function SignInPage() {
  const identifierId = useId();
  const errorId = useId();
  const location = useLocation();
  const navigate = useNavigate();
  const establishSession = useEstablishSession();
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const passwordUpdatedNotice =
    typeof location.state === "object" &&
    location.state !== null &&
    "passwordUpdated" in location.state &&
    typeof location.state.passwordUpdated === "string"
      ? location.state.passwordUpdated
      : undefined;

  useEffect(() => {
    document.title = "Sign in — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const trimmedIdentifier = identifier.trim();
      const session = await loginWithPassword(trimmedIdentifier, password);
      await establishSession(session, trimmedIdentifier);
      navigate("/home", { replace: true });
    } catch (caught) {
      setError(signInErrorMessage(caught));
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      intro="Sign in with the phone number or email you used to join DateZA."
    >
      <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
        {passwordUpdatedNotice ? (
          <p className="auth-form__notice" role="status">
            {passwordUpdatedNotice}
          </p>
        ) : null}
        {error ? (
          <p className="auth-form__error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
        <div className="onboard-segmented" role="radiogroup" aria-label="Sign in with">
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
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          disabled={pending}
          describedBy={error ? errorId : undefined}
        />
        <p className="auth-form__hint">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
        <button className="auth-form__submit" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="auth-screen__switch">
        New to DateZA? <Link to="/sign-up">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
