import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getProfileConfiguration, replaceProfileOptions, updateCurrentProfile } from "../../lib/api/profile.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { OptionsForm } from "../onboarding/OptionsForm.tsx";
import { useOwnAccount } from "../shell/useOwnAccount.ts";

const SECTION_GROUPS: Record<string, string[]> = {
  intent: ["relationship_intent", "marriage_intent"],
  family: ["has_children", "wants_children"],
  lifestyle: ["diet", "pets", "travel", "travel_frequency", "sleep_schedule"],
  personality: ["social_style", "communication_style", "planning_style"],
  interests: ["interests"],
};

export default function EditProfilePage() {
  const account = useOwnAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const nameId = useId();
  const bioId = useId();
  const lookingId = useId();
  const jobId = useId();
  const occupationId = useId();
  const schoolId = useId();
  const cityId = useId();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [occupation, setOccupation] = useState("");
  const [school, setSchool] = useState("");
  const [city, setCity] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [seededFrom, setSeededFrom] = useState<string | null>(null);

  if (account.profile && account.profile.id !== seededFrom) {
    setSeededFrom(account.profile.id);
    setDisplayName(account.profile.display_name ?? "");
    setBio(account.profile.bio ?? "");
    setLookingFor(account.profile.looking_for_text ?? "");
    setJobTitle(account.profile.job_title ?? "");
    setOccupation(account.profile.occupation ?? "");
    setSchool(account.profile.school_or_institution ?? "");
    setCity(account.profile.city ?? "");
    setSelections(account.profile.options);
  }

  useEffect(() => {
    document.title = "Edit profile — DateZA";
    let cancelled = false;
    getProfileConfiguration()
      .then((result) => {
        if (!cancelled) setConfiguration(result.configuration);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash, configuration]);

  function toggle(groupKey: string, code: string, cardinality: "single" | "multiple") {
    setSelections((current) => {
      const existing = current[groupKey] ?? [];
      if (cardinality === "single") return { ...current, [groupKey]: [code] };
      const next = existing.includes(code) ? existing.filter((item) => item !== code) : [...existing, code];
      return { ...current, [groupKey]: next };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      await updateCurrentProfile({
        display_name: displayName,
        bio,
        city,
        looking_for_text: lookingFor,
        job_title: jobTitle,
        occupation,
        school_or_institution: school,
      });
      await replaceProfileOptions(selections);
      account.refresh();
      navigate("/profile");
    } catch {
      setError("We could not save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveOptionsOnly() {
    setSaving(true);
    setError(undefined);
    try {
      await replaceProfileOptions(selections);
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

  const groups = configuration?.option_groups ?? [];
  function groupsFor(section: keyof typeof SECTION_GROUPS) {
    const keys = new Set(SECTION_GROUPS[section]);
    return groups.filter((group) => keys.has(group.key));
  }

  const languageGroup = groups.find((group) => group.key === "languages" || group.key === "languages_spoken");

  return (
    <div className="shell-page shell-page--narrow">
      <Link className="onboard-back-top" to="/profile">
        ← Back to profile
      </Link>
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Your profile</p>
        <h1 className="shell-page__title">Edit profile</h1>
        <p className="shell-page__subtitle">Update the details people see — no need to repeat onboarding.</p>
      </div>

      <p className="profile-edit-jump">
        <Link to="/profile/photos">Photos</Link>
        <a href="#about">About</a>
        <a href="#looking-for">Looking for</a>
        <a href="#work">Work</a>
        <a href="#lifestyle">Lifestyle</a>
        <a href="#interests">Interests</a>
      </p>

      <form className="auth-form" onSubmit={(event) => void onSubmit(event)}>
        {error ? (
          <p className="auth-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <section className="profile-edit-section" id="about">
          <h2>About you</h2>
          <div className="auth-field">
            <label htmlFor={nameId}>Display name</label>
            <input id={nameId} type="text" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={60} />
          </div>
          <div className="auth-field">
            <label htmlFor={cityId}>City</label>
            <input id={cityId} type="text" value={city} onChange={(event) => setCity(event.target.value)} maxLength={80} />
          </div>
          <div className="auth-field">
            <label htmlFor={bioId}>About me</label>
            <textarea id={bioId} value={bio} onChange={(event) => setBio(event.target.value)} rows={5} maxLength={600} />
          </div>
        </section>

        <section className="profile-edit-section" id="looking-for">
          <h2>What I&apos;m looking for</h2>
          <div className="auth-field">
            <label htmlFor={lookingId}>In your words</label>
            <textarea id={lookingId} value={lookingFor} onChange={(event) => setLookingFor(event.target.value)} rows={4} maxLength={400} />
          </div>
        </section>

        <section className="profile-edit-section" id="work">
          <h2>Work &amp; education</h2>
          <div className="auth-field">
            <label htmlFor={jobId}>Job title</label>
            <input id={jobId} type="text" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} maxLength={80} />
          </div>
          <div className="auth-field">
            <label htmlFor={occupationId}>What you do</label>
            <input id={occupationId} type="text" value={occupation} onChange={(event) => setOccupation(event.target.value)} maxLength={80} />
          </div>
          <div className="auth-field">
            <label htmlFor={schoolId}>School or university</label>
            <input id={schoolId} type="text" value={school} onChange={(event) => setSchool(event.target.value)} maxLength={80} />
          </div>
        </section>

        <button className="auth-form__submit" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      {groupsFor("intent").length > 0 ? (
        <section className="profile-edit-section" id="intent">
          <h2>Relationship intent</h2>
          <OptionsForm
            groups={groupsFor("intent")}
            selections={selections}
            onToggle={toggle}
            onSubmit={saveOptionsOnly}
            pending={saving}
            error={error}
            submitLabel="Save intent"
          />
        </section>
      ) : null}

      {groupsFor("family").length > 0 ? (
        <section className="profile-edit-section" id="family">
          <h2>Family plans</h2>
          <OptionsForm
            groups={groupsFor("family")}
            selections={selections}
            onToggle={toggle}
            onSubmit={saveOptionsOnly}
            pending={saving}
            error={error}
            submitLabel="Save family plans"
          />
        </section>
      ) : null}

      {groupsFor("lifestyle").length > 0 ? (
        <section className="profile-edit-section" id="lifestyle">
          <h2>Lifestyle</h2>
          <OptionsForm
            groups={groupsFor("lifestyle")}
            selections={selections}
            onToggle={toggle}
            onSubmit={saveOptionsOnly}
            pending={saving}
            error={error}
            submitLabel="Save lifestyle"
          />
        </section>
      ) : null}

      {groupsFor("personality").length > 0 ? (
        <section className="profile-edit-section" id="personality">
          <h2>How you connect</h2>
          <OptionsForm
            groups={groupsFor("personality")}
            selections={selections}
            onToggle={toggle}
            onSubmit={saveOptionsOnly}
            pending={saving}
            error={error}
            submitLabel="Save"
          />
        </section>
      ) : null}

      {groupsFor("interests").length > 0 ? (
        <section className="profile-edit-section" id="interests">
          <h2>Interests</h2>
          <OptionsForm
            groups={groupsFor("interests")}
            selections={selections}
            onToggle={toggle}
            onSubmit={saveOptionsOnly}
            pending={saving}
            error={error}
            submitLabel="Save interests"
          />
        </section>
      ) : null}

      {languageGroup ? (
        <section className="profile-edit-section" id="languages">
          <h2>Languages</h2>
          <OptionsForm
            groups={[languageGroup]}
            selections={selections}
            onToggle={toggle}
            onSubmit={saveOptionsOnly}
            pending={saving}
            error={error}
            submitLabel="Save languages"
          />
        </section>
      ) : null}

      <section className="profile-edit-section" id="prompts">
        <h2>Prompts</h2>
        <p className="profile-section__text">Prompt answers appear on your public profile. Photo updates live on the photos page.</p>
        <Link className="shell-text-action" to="/profile/photos">
          Manage photos
        </Link>
      </section>
    </div>
  );
}
