import { useEffect, useId, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getOwnerPrompts,
  getProfileConfiguration,
  replaceOwnerPrompts,
  replaceProfileOptions,
  updateCurrentProfile,
} from "../../lib/api/profile.ts";
import type { ConfiguredField, ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import type { PromptAnswer } from "../../lib/api/findTypes.ts";
import { MultiChoiceField, SingleChoiceField } from "../onboarding/ChoiceFields.tsx";
import { OptionsForm } from "../onboarding/OptionsForm.tsx";
import { lifestyleChoices } from "../onboarding/presentation.ts";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { PromptEditor } from "./PromptEditor.tsx";

const SECTION_GROUPS: Record<string, string[]> = {
  intent: ["relationship_intent", "marriage_intent"],
  family: ["has_children", "wants_children"],
  faith: ["religion", "religion_importance"],
  lifestyle: ["diet", "pets", "travel", "travel_frequency", "sleep_schedule"],
  personality: ["social_style", "communication_style", "planning_style", "meeting_pace"],
  interests: ["interests"],
  education: ["education", "education_level"],
};

const OPTION_KEYS_TO_OMIT = new Set(["languages", "languages_spoken"]);

export default function EditProfilePage() {
  const account = useOwnAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const nameId = useId();
  const bioId = useId();
  const lookingId = useId();
  const jobId = useId();
  const occupationId = useId();
  const companyId = useId();
  const schoolId = useId();
  const cityId = useId();
  const heightId = useId();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [occupation, setOccupation] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [school, setSchool] = useState("");
  const [city, setCity] = useState("");
  const [height, setHeight] = useState("");
  const [smoking, setSmoking] = useState("");
  const [drinking, setDrinking] = useState("");
  const [fitness, setFitness] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [promptAnswers, setPromptAnswers] = useState<PromptAnswer[] | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [promptError, setPromptError] = useState<string | undefined>();
  const [seededFrom, setSeededFrom] = useState<string | null>(null);

  if (account.profile && account.profile.id !== seededFrom) {
    setSeededFrom(account.profile.id);
    setDisplayName(account.profile.display_name ?? "");
    setBio(account.profile.bio ?? "");
    setLookingFor(account.profile.looking_for_text ?? "");
    setJobTitle(account.profile.job_title ?? "");
    setOccupation(account.profile.occupation ?? "");
    setCompanyName(account.profile.company_name ?? "");
    setSchool(account.profile.school_or_institution ?? "");
    setCity(account.profile.city ?? "");
    setHeight(account.profile.height_cm != null ? String(account.profile.height_cm) : "");
    setSmoking(account.profile.smoking ?? "");
    setDrinking(account.profile.drinking ?? "");
    setFitness(account.profile.fitness ?? "");
    setLanguages(account.profile.languages_spoken);
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
    getOwnerPrompts()
      .then((answers) => {
        if (!cancelled) setPromptAnswers(answers);
      })
      .catch(() => {
        if (!cancelled) setPromptAnswers(account.profile?.prompts ?? []);
      });
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [account.profile?.prompts]);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash, configuration, promptAnswers]);

  function toggle(groupKey: string, code: string, cardinality: "single" | "multiple") {
    setSelections((current) => {
      const existing = current[groupKey] ?? [];
      if (cardinality === "single") return { ...current, [groupKey]: [code] };
      const next = existing.includes(code) ? existing.filter((item) => item !== code) : [...existing, code];
      return { ...current, [groupKey]: next };
    });
  }

  function optionPayload(current: Record<string, string[]>) {
    const selectionsToSend: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(current)) {
      if (!OPTION_KEYS_TO_OMIT.has(key)) selectionsToSend[key] = value;
    }
    return selectionsToSend;
  }

  function parsedHeight(): number | null | undefined {
    const trimmed = height.trim();
    if (!trimmed) return null;
    const value = Number.parseInt(trimmed, 10);
    return Number.isFinite(value) ? value : undefined;
  }

  async function saveProfileScalars() {
    const heightCm = parsedHeight();
    await updateCurrentProfile({
      display_name: displayName,
      bio,
      city,
      looking_for_text: lookingFor,
      job_title: jobTitle,
      occupation,
      company_name: companyName,
      school_or_institution: school,
      smoking: smoking || undefined,
      drinking: drinking || undefined,
      fitness: fitness || undefined,
      languages,
      ...(heightCm === undefined ? {} : { height_cm: heightCm }),
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      await saveProfileScalars();
      await replaceProfileOptions(optionPayload(selections));
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
      await replaceProfileOptions(optionPayload(selections));
      account.refresh();
      navigate("/profile");
    } catch {
      setError("We could not save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveLifestyle() {
    setSaving(true);
    setError(undefined);
    try {
      await saveProfileScalars();
      await replaceProfileOptions(optionPayload(selections));
      account.refresh();
      navigate("/profile");
    } catch {
      setError("We could not save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveLanguages() {
    setSaving(true);
    setError(undefined);
    try {
      await updateCurrentProfile({ languages });
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

  const profileFields = configuration?.profile_fields ?? [];
  const allFields = [...(configuration?.identity_fields ?? []), ...profileFields];
  function field(key: string): ConfiguredField | undefined {
    return allFields.find((item) => item.key === key);
  }
  const languageField = allFields.find(
    (item) => item.key === "languages" || item.input_type === "language_list",
  );
  const smokingField = field("smoking");
  const drinkingField = field("drinking");
  const fitnessField = field("fitness");

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
        <a href="#languages">Languages</a>
        <a href="#prompts">Prompts</a>
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
            <label htmlFor={heightId}>Height (cm)</label>
            <input
              id={heightId}
              type="number"
              inputMode="numeric"
              min={100}
              max={250}
              value={height}
              onChange={(event) => setHeight(event.target.value)}
            />
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
            <label htmlFor={companyId}>Company</label>
            <input id={companyId} type="text" value={companyName} onChange={(event) => setCompanyName(event.target.value)} maxLength={80} />
            <p className="auth-form__hint">Only you can see this.</p>
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

      {groupsFor("education").length > 0 ? (
        <section className="profile-edit-section">
          <OptionsForm
            groups={groupsFor("education")}
            selections={selections}
            onToggle={toggle}
            onSubmit={saveOptionsOnly}
            pending={saving}
            error={error}
            submitLabel="Save education"
          />
        </section>
      ) : null}

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
          <p className="profile-section__text">These answers stay private. They help DateZA understand what you&apos;re looking for.</p>
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

      {groupsFor("faith").length > 0 ? (
        <section className="profile-edit-section" id="faith">
          <h2>Faith</h2>
          <p className="profile-section__text">Only you can see these answers on DateZA.</p>
          <OptionsForm
            groups={groupsFor("faith")}
            selections={selections}
            onToggle={toggle}
            onSubmit={saveOptionsOnly}
            pending={saving}
            error={error}
            submitLabel="Save"
          />
        </section>
      ) : null}

      <section className="profile-edit-section" id="lifestyle">
        <h2>Lifestyle</h2>
          <SingleChoiceField
            legend={smokingField?.label ?? "Smoking"}
            name="smoking"
            options={lifestyleChoices("smoking", smokingField?.options ?? [])}
            value={smoking}
            onChange={setSmoking}
            disabled={saving}
            layout="segmented"
          />
          <SingleChoiceField
            legend={drinkingField?.label ?? "Drinking"}
            name="drinking"
            options={lifestyleChoices("drinking", drinkingField?.options ?? [])}
            value={drinking}
            onChange={setDrinking}
            disabled={saving}
            layout="segmented"
          />
        {fitnessField ? (
          <SingleChoiceField
            legend={fitnessField.label}
            name="fitness"
            options={fitnessField.options}
            value={fitness}
            onChange={setFitness}
            disabled={saving}
            compact
          />
        ) : null}
        {groupsFor("lifestyle").length > 0 ? (
          <OptionsForm
            groups={groupsFor("lifestyle")}
            selections={selections}
            onToggle={toggle}
            onSubmit={saveLifestyle}
            pending={saving}
            error={error}
            submitLabel="Save lifestyle"
          />
        ) : (
          <div className="onboard-actions">
            <button className="auth-form__submit" type="button" disabled={saving} onClick={() => void saveLifestyle()}>
              {saving ? "Saving…" : "Save lifestyle"}
            </button>
          </div>
        )}
      </section>

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

      {languageField ? (
        <section className="profile-edit-section" id="languages">
          <h2>Languages</h2>
          <MultiChoiceField
            legend={languageField.label}
            name="languages"
            options={languageField.options}
            values={languages}
            onChange={setLanguages}
            disabled={saving}
            compact
          />
          <div className="onboard-actions">
            <button className="auth-form__submit" type="button" disabled={saving} onClick={() => void saveLanguages()}>
              {saving ? "Saving…" : "Save languages"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="profile-edit-section" id="prompts">
        <h2>Profile prompts</h2>
        {promptAnswers ? (
          <PromptEditor
            definitions={configuration?.prompts ?? []}
            answers={promptAnswers}
            pending={saving}
            error={promptError}
            onSave={async (answers) => {
              setSaving(true);
              setPromptError(undefined);
              try {
                const saved = await replaceOwnerPrompts(answers);
                setPromptAnswers(saved);
                account.refresh();
                navigate("/profile");
              } catch {
                setPromptError("We could not save your prompts. Try again.");
              } finally {
                setSaving(false);
              }
            }}
          />
        ) : (
          <p className="profile-section__text">Loading your prompts…</p>
        )}
      </section>
    </div>
  );
}
