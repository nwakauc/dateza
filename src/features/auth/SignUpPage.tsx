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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    document.title = `${PAGE_TITLE} — DateZA`;
    return () => {
      document.title = "DateZA — Meet someone who gets you.";
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
      const session = await registerWithPassword(identifier.trim(), password);
      await establishSession(session.token);
      navigate("/signed-in", { replace: true });
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
