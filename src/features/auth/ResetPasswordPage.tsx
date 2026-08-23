import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetPasswordWithRecovery } from "../../lib/api/auth.ts";
import { AuthLayout } from "./AuthLayout.tsx";
import { PasswordField } from "./PasswordField.tsx";
import { recoveryResetErrorMessage } from "./authErrors.ts";
import { isResetPasswordLocationState } from "./resetPasswordState.ts";

export default function ResetPasswordPage() {
  const errorId = useId();
  const location = useLocation();
  const navigate = useNavigate();
  const resetToken = isResetPasswordLocationState(location.state)
    ? location.state.resetToken
    : undefined;
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    document.title = "Choose a new password — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !resetToken) {
      return;
    }
    if (password !== confirmation) {
      setError("The new password fields must match.");
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const result = await resetPasswordWithRecovery(resetToken, password, confirmation);
      navigate("/sign-in", { replace: true, state: { passwordUpdated: result.message } });
    } catch (caught) {
      setError(recoveryResetErrorMessage(caught));
      setPending(false);
    }
  }

  if (!resetToken) {
    return (
      <AuthLayout
        title="Start recovery again"
        intro="A password reset has to follow the recovery code step. Tokens are not kept in the address bar."
      >
        <p className="auth-screen__switch">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      intro="Use at least 6 characters. This signs you out of DateZA on every device that used the old password."
    >
      <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
        {error ? (
          <p className="auth-form__error" id={errorId} role="alert">
            {error}
          </p>
        ) : null}
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          disabled={pending}
          describedBy={error ? errorId : undefined}
        />
        <PasswordField
          label="Confirm new password"
          name="password_confirmation"
          autoComplete="new-password"
          value={confirmation}
          onChange={setConfirmation}
          disabled={pending}
          describedBy={error ? errorId : undefined}
        />
        <button className="auth-form__submit" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </AuthLayout>
  );
}
