import { type FormEvent } from "react";

type Props = {
  onSubmit: () => Promise<void>;
  pending: boolean;
  error?: string;
};

export function PublishStep({ onSubmit, pending, error }: Props) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) {
      return;
    }
    await onSubmit();
  }

  return (
    <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
      {error ? (
        <p className="auth-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="onboard-actions">
        <button className="auth-form__submit" type="submit" disabled={pending}>
          {pending ? "Publishing…" : "Publish profile"}
        </button>
      </div>
    </form>
  );
}
