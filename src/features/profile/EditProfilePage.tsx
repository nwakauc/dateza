import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateCurrentProfile } from "../../lib/api/profile.ts";
import { useOwnAccount } from "../shell/useOwnAccount.ts";

export default function EditProfilePage() {
  const account = useOwnAccount();
  const navigate = useNavigate();
  const nameId = useId();
  const bioId = useId();
  const cityId = useId();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Seeds the form once the profile arrives from AppShell's shared fetch.
  // Setting state during render (guarded so it runs once per profile id) is
  // React's documented pattern for this — an effect here would cause an
  // avoidable extra render pass.
  const [seededFrom, setSeededFrom] = useState<string | null>(null);
  if (account.profile && account.profile.id !== seededFrom) {
    setSeededFrom(account.profile.id);
    setDisplayName(account.profile.display_name ?? "");
    setBio(account.profile.bio ?? "");
    setCity(account.profile.city ?? "");
  }

  useEffect(() => {
    document.title = "Edit profile — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      await updateCurrentProfile({ display_name: displayName, bio, city });
      account.refresh();
      navigate("/profile");
    } catch {
      setError("We could not save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (account.loading) {
    return (
      <div className="shell-page shell-page--narrow">
        <p className="shell-page__subtitle">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="shell-page shell-page--narrow">
      <Link className="onboard-back-top" to="/profile">
        ← Back to profile
      </Link>
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Your profile</p>
        <h1 className="shell-page__title">Edit profile</h1>
        <p className="shell-page__subtitle">This is what people see on Discover and Find.</p>
      </div>

      <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="auth-field">
          <label htmlFor={nameId}>Display name</label>
          <input
            id={nameId}
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={60}
          />
        </div>
        <div className="auth-field">
          <label htmlFor={cityId}>City</label>
          <input id={cityId} type="text" value={city} onChange={(event) => setCity(event.target.value)} maxLength={80} />
        </div>
        <div className="auth-field">
          <label htmlFor={bioId}>About me</label>
          <textarea id={bioId} value={bio} onChange={(event) => setBio(event.target.value)} rows={5} maxLength={600} />
        </div>
        <button className="auth-form__submit" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
