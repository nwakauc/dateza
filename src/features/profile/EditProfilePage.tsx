import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getOwnerPrompts,
  getProfileConfiguration,
  getProfilePreferences,
  replaceOwnerPrompts,
  replaceProfileOptions,
  updateCurrentProfile,
  updateProfilePreferences,
} from "../../lib/api/profile.ts";
import { listOwnerPhotos } from "../../lib/api/photos.ts";
import type { OwnerPhoto } from "../../lib/api/photoTypes.ts";
import type {
  ConfiguredField,
  ConfiguredOptionGroup,
  OwnerProfile,
  ProfileConfiguration,
  ProfilePreferences,
} from "../../lib/api/profileTypes.ts";
import { BROAD_PREFERENCE_DEFAULTS, countryChoices, genderChoices, lifestyleChoices, optionGroupChoices } from "../onboarding/presentation.ts";
import { BirthdateField } from "../onboarding/BirthdateField.tsx";
import { MultiChoiceField, SingleChoiceField } from "../onboarding/ChoiceFields.tsx";
import {
  interestedChipSelected,
  interestedInDisplayOptions,
  interestedInGenderCodes,
  toggleInterestedIn,
} from "../onboarding/interestedIn.ts";
import { canInteract } from "../session/verificationState.ts";
import { ChevronLeftIcon, ChevronRightIcon, ShieldCheckIcon } from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { useVerificationGate } from "../verification/useVerificationGate.ts";
import { Modal } from "../verification/Modal.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { ProfileManageNav } from "./ProfileManageNav.tsx";
import { datezaRichness } from "./richProfileGaps.ts";
import { PromptEditor } from "./PromptEditor.tsx";
import { promptDraftsFromAnswers, type PromptDraft } from "./promptDrafts.ts";
import { CharCount, PrivacyNote, SelectField } from "./edit/FieldControls.tsx";
import { DatingLocationSearch } from "./edit/DatingLocationSearch.tsx";
import { EditPhotosSection } from "./edit/EditPhotosSection.tsx";
import { EditPreviewCard } from "./edit/EditPreviewCard.tsx";
import { InterestsPicker } from "./edit/InterestsPicker.tsx";
import { LanguagesEditor } from "./edit/LanguagesEditor.tsx";
import { OptionSelects } from "./edit/OptionSelects.tsx";
import { ProfileStrengthCard } from "./edit/ProfileStrengthCard.tsx";
import {
  DATING_OPTION_KEYS,
  EDIT_SECTIONS,
  EDUCATION_OPTION_KEYS,
  INTENT_OPTION_KEYS,
  LIFESTYLE_OPTION_KEYS,
  OPTION_KEYS_TO_OMIT,
  PERSONALITY_OPTION_KEYS,
  type EditSectionId,
  sectionIdFromHash,
} from "./edit/sections.ts";

const NAME_MAX = 60;
const BIO_MAX = 600;
const LOOKING_MAX = 400;

type Draft = {
  displayName: string;
  bio: string;
  lookingFor: string;
  jobTitle: string;
  occupation: string;
  companyName: string;
  school: string;
  city: string;
  countryCode: string;
  height: string;
  smoking: string;
  drinking: string;
  fitness: string;
  gender: string;
  birthdate: string;
  languages: string[];
  interestedIn: string[];
  selections: Record<string, string[]>;
  prompts: PromptDraft[];
};

function seedDraft(profile: OwnerProfile, preferences: ProfilePreferences | null, prompts: PromptDraft[]): Draft {
  return {
    displayName: profile.display_name ?? "",
    bio: profile.bio ?? "",
    lookingFor: profile.looking_for_text ?? "",
    jobTitle: profile.job_title ?? "",
    occupation: profile.occupation ?? "",
    companyName: profile.company_name ?? "",
    school: profile.school_or_institution ?? "",
    city: profile.city ?? "",
    countryCode: profile.country_code ?? "",
    height: profile.height_cm != null ? String(profile.height_cm) : "",
    smoking: profile.smoking ?? "",
    drinking: profile.drinking ?? "",
    fitness: profile.fitness ?? "",
    gender: profile.gender ?? "",
    birthdate: profile.birthdate ?? "",
    languages: profile.languages_spoken,
    interestedIn: preferences?.interested_in ?? [],
    selections: { ...profile.options },
    prompts,
  };
}

function serializeDraft(draft: Draft): string {
  return JSON.stringify(draft);
}

function parsedHeight(height: string): number | null | undefined {
  const trimmed = height.trim();
  if (!trimmed) return null;
  const value = Number.parseInt(trimmed, 10);
  return Number.isFinite(value) ? value : undefined;
}

function optionPayload(current: Record<string, string[]>): Record<string, string[]> {
  const selectionsToSend: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(current)) {
    if (!OPTION_KEYS_TO_OMIT.has(key)) selectionsToSend[key] = value;
  }
  return selectionsToSend;
}

function groupsNamed(groups: ConfiguredOptionGroup[], keys: readonly string[]) {
  const set = new Set(keys);
  return groups.filter((group) => set.has(group.key));
}

function ownerFromDraft(base: OwnerProfile, draft: Draft): OwnerProfile {
  return {
    ...base,
    display_name: draft.displayName,
    bio: draft.bio,
    looking_for_text: draft.lookingFor,
    job_title: draft.jobTitle,
    occupation: draft.occupation,
    company_name: draft.companyName,
    school_or_institution: draft.school,
    city: draft.city,
    country_code: draft.countryCode,
    height_cm: parsedHeight(draft.height) ?? null,
    smoking: draft.smoking || null,
    drinking: draft.drinking || null,
    fitness: draft.fitness || null,
    gender: draft.gender || null,
    birthdate: draft.birthdate || null,
    languages_spoken: draft.languages,
    options: draft.selections,
    prompts: draft.prompts.map((item, position) => ({
      key: item.key,
      prompt: item.key,
      answer: item.answer,
      position,
    })),
  };
}

export default function EditProfilePage() {
  const account = useOwnAccount();
  const navigate = useNavigate();
  const location = useLocation();
  const { verification, pendingReason, openPrompt, dismiss } = useVerificationGate();
  const nameId = useId();
  const bioId = useId();
  const lookingId = useId();
  const jobId = useId();
  const occupationId = useId();
  const companyId = useId();
  const schoolId = useId();
  const cityId = useId();
  const heightId = useId();

  const [draft, setDraft] = useState<Draft | undefined>();
  const [baseline, setBaseline] = useState<string>("");
  const [preferences, setPreferences] = useState<ProfilePreferences | null>(null);
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const hashSection = sectionIdFromHash(location.hash);
  const [spy, setSpy] = useState<{ hash: string; id: EditSectionId } | null>(null);
  const active = spy && spy.hash === location.hash ? spy.id : hashSection;
  const [previewPhotos, setPreviewPhotos] = useState<OwnerPhoto[]>([]);
  const seededFrom = useRef<string | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Edit profile — DateZA";
    let cancelled = false;
    void Promise.allSettled([getProfileConfiguration(), getOwnerPrompts(), getProfilePreferences()]).then(
      ([configResult, promptResult, prefsResult]) => {
        if (cancelled) return;
        const config = configResult.status === "fulfilled" ? configResult.value.configuration : undefined;
        if (config) setConfiguration(config);
        const prompts =
          promptResult.status === "fulfilled"
            ? promptDraftsFromAnswers(promptResult.value)
            : promptDraftsFromAnswers(account.profile?.prompts ?? []);
        const prefs = prefsResult.status === "fulfilled" ? prefsResult.value : null;
        setPreferences(prefs);
        const owner = account.profile;
        if (owner && seededFrom.current !== owner.id) {
          const next = seedDraft(owner, prefs, prompts);
          seededFrom.current = owner.id;
          setDraft(next);
          setBaseline(serializeDraft(next));
        }
      },
    );
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [account.profile]);

  useEffect(() => {
    const section = sectionIdFromHash(location.hash);
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  useEffect(() => {
    let cancelled = false;
    listOwnerPhotos()
      .then((photos) => {
        if (!cancelled) setPreviewPhotos(photos);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [account.photoCount]);

  useEffect(() => {
    const root = workspaceRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 1099px)").matches) return;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-edit-section]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.id;
        if (id && EDIT_SECTIONS.some((section) => section.id === id)) {
          setSpy({ hash: location.hash, id: id as EditSectionId });
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [draft, configuration, location.hash]);

  const dirty = draft != null && serializeDraft(draft) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function patch(partial: Partial<Draft>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
    setSavedFlash(false);
  }

  function toggleSelection(groupKey: string, code: string, cardinality: "single" | "multiple") {
    setDraft((current) => {
      if (!current) return current;
      const existing = current.selections[groupKey] ?? [];
      const next =
        cardinality === "single"
          ? code
            ? [code]
            : []
          : existing.includes(code)
            ? existing.filter((item) => item !== code)
            : [...existing, code];
      return { ...current, selections: { ...current.selections, [groupKey]: next } };
    });
    setSavedFlash(false);
  }

  function goSection(id: EditSectionId) {
    setSpy({ hash: `#${id}`, id });
    navigate({ pathname: "/profile/edit", hash: id }, { replace: true });
  }

  async function save() {
    if (!draft || saving) return;
    setSaving(true);
    setSectionErrors({});
    const errors: Record<string, string> = {};
    try {
      const heightCm = parsedHeight(draft.height);
      try {
        await updateCurrentProfile({
          display_name: draft.displayName,
          bio: draft.bio,
          city: draft.city,
          country_code: draft.countryCode || undefined,
          looking_for_text: draft.lookingFor,
          job_title: draft.jobTitle,
          occupation: draft.occupation,
          company_name: draft.companyName,
          school_or_institution: draft.school,
          smoking: draft.smoking || undefined,
          drinking: draft.drinking || undefined,
          fitness: draft.fitness || undefined,
          languages: draft.languages,
          gender: draft.gender || undefined,
          birthdate: /^\d{4}-\d{2}-\d{2}$/.test(draft.birthdate) ? draft.birthdate : undefined,
          ...(heightCm === undefined ? {} : { height_cm: heightCm }),
        });
      } catch {
        errors.about = "We couldn't save your profile details. Try again.";
      }
      if (draft.interestedIn.length > 0) {
        try {
          await updateProfilePreferences({
            min_age: preferences?.min_age ?? BROAD_PREFERENCE_DEFAULTS.min_age,
            max_age: preferences?.max_age ?? BROAD_PREFERENCE_DEFAULTS.max_age,
            max_distance_km: preferences?.max_distance_km ?? BROAD_PREFERENCE_DEFAULTS.max_distance_km,
            interested_in: draft.interestedIn,
          });
        } catch {
          errors.about = errors.about ?? "We couldn't save who you're interested in. Try again.";
        }
      }
      try {
        await replaceProfileOptions(optionPayload(draft.selections));
      } catch {
        errors.options = "We couldn't save some of your answers. Try again.";
      }
      let nextPrompts = draft.prompts;
      if (draft.prompts.every((item) => item.answer.trim()) || draft.prompts.length === 0) {
        try {
          const saved = await replaceOwnerPrompts(draft.prompts.map((item) => ({ key: item.key, answer: item.answer.trim() })));
          nextPrompts = promptDraftsFromAnswers(saved);
        } catch {
          errors.prompts = "We couldn't save your prompts. Try again.";
        }
      } else {
        errors.prompts = "Finish each prompt before saving, or remove the empty one.";
      }
      account.refresh();
      if (Object.keys(errors).length === 0) {
        const savedDraft = { ...draft, prompts: nextPrompts };
        setDraft(savedDraft);
        setBaseline(serializeDraft(savedDraft));
        setSavedFlash(true);
      } else {
        setSectionErrors(errors);
      }
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    navigate("/profile");
  }

  if (account.loading || !draft) {
    return (
      <div className="edit-profile">
        <div className="edit-profile__skeleton" aria-busy="true">
          <div className="edit-skeleton edit-skeleton--nav" />
          <div className="edit-skeleton edit-skeleton--form" />
          <div className="edit-skeleton edit-skeleton--preview" />
        </div>
      </div>
    );
  }

  const groups = configuration?.option_groups ?? [];
  const allFields = [...(configuration?.identity_fields ?? []), ...(configuration?.profile_fields ?? [])];
  function field(key: string): ConfiguredField | undefined {
    return allFields.find((item) => item.key === key);
  }
  const languageField = allFields.find((item) => item.key === "languages" || item.input_type === "language_list");
  const photoCollection = configuration?.collections.find((item) => item.key === "photos");
  const interestGroup = groups.find((group) => group.key === "interests");
  const intentGroup = groupsNamed(groups, INTENT_OPTION_KEYS)[0];
  const interestedField = configuration?.preference_fields.find((item) => item.key === "interested_in");
  const genderCodes = interestedInGenderCodes(interestedField?.options ?? []);
  const verified = canInteract(verification) || account.profile?.contact_verified === true;
  const richness = datezaRichness(account.profile, account.photoCount);
  const previewOwner = account.profile ? ownerFromDraft(account.profile, draft) : undefined;

  const lifestyleGroups = groupsNamed(groups, LIFESTYLE_OPTION_KEYS);
  const datingGroups = groupsNamed(groups, [...DATING_OPTION_KEYS, ...PERSONALITY_OPTION_KEYS]);
  const educationGroups = groupsNamed(groups, EDUCATION_OPTION_KEYS);

  const otherSections = EDIT_SECTIONS.filter((section) => section.id !== active && section.id !== "preview");

  return (
    <div className="edit-profile">
      <header className="edit-profile__header">
        <Link className="edit-profile__back" to="/profile">
          <ChevronLeftIcon />
          <span className="onboard-sr-only">Back</span>
        </Link>
        <div>
          <h1>Edit profile</h1>
          <p>Make your profile feel like you.</p>
        </div>
      </header>

      <div className="edit-profile__layout">
        <aside className="edit-profile__nav" aria-label="Profile sections">
          <ProfileManageNav current={active} />
          <div className="edit-profile__nav-strength">
            <ProfileStrengthCard profileCompletion={account.profile?.profile_completion ?? null} richness={richness} />
          </div>
        </aside>

        <div className="edit-profile__workspace" ref={workspaceRef}>
          <nav className="edit-profile__tabs" aria-label="Jump to section">
            {EDIT_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={active === section.id ? "is-active" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  goSection(section.id);
                }}
              >
                {section.label}
              </a>
            ))}
          </nav>

          <div className={active === "about" ? undefined : "edit-profile__mobile-hide"} data-edit-section id="about">
            <section className="edit-profile__block">
              <header className="edit-profile__block-head">
                <h2>About you</h2>
                <p>Let’s help others get to know the real you.</p>
              </header>
              {sectionErrors.about ? (
                <p className="auth-form__error" role="alert">
                  {sectionErrors.about}
                </p>
              ) : null}
              <div className="auth-field">
                <label htmlFor={nameId}>Display name</label>
                <input
                  id={nameId}
                  type="text"
                  value={draft.displayName}
                  maxLength={NAME_MAX}
                  onChange={(event) => patch({ displayName: event.target.value })}
                />
                <CharCount value={draft.displayName} max={NAME_MAX} />
              </div>
              <BirthdateField
                id="edit-birthdate"
                label={field("birthdate")?.label ?? "Date of birth"}
                value={draft.birthdate}
                onChange={(iso) => patch({ birthdate: iso })}
                disabled={saving}
                required={false}
              />
              <div className="edit-profile__grid">
                <SelectField
                  id="edit-gender"
                  label={field("gender")?.label ?? "Gender"}
                  value={draft.gender}
                  onChange={(value) => patch({ gender: value })}
                  options={genderChoices(field("gender")?.options ?? [])}
                  allowEmpty={false}
                  placeholder="Select"
                />
                {interestedField ? (
                  <div>
                    <MultiChoiceField
                      legend="Interested in"
                      name="interested_in"
                      options={interestedInDisplayOptions(interestedField.options)}
                      values={draft.interestedIn}
                      onChange={(codes) => patch({ interestedIn: codes })}
                      onToggle={(code) => patch({ interestedIn: toggleInterestedIn(draft.interestedIn, code, genderCodes) })}
                      isSelected={(code) => interestedChipSelected(draft.interestedIn, code, genderCodes)}
                      disabled={saving}
                      compact
                    />
                    <PrivacyNote>This stays private. It only shapes who DateZA shows you.</PrivacyNote>
                  </div>
                ) : null}
              </div>
              <div className="edit-profile__grid">
                <SelectField
                  id="edit-country"
                  label="Country"
                  value={draft.countryCode}
                  onChange={(value) => patch({ countryCode: value })}
                  options={countryChoices()}
                  allowEmpty={false}
                />
                <div className="auth-field">
                  <label htmlFor={cityId}>City</label>
                  <input id={cityId} type="text" value={draft.city} maxLength={80} onChange={(event) => patch({ city: event.target.value })} />
                </div>
              </div>
              <p className="edit-profile__kicker">Where are you dating from?</p>
              {account.profile ? <DatingLocationSearch profileId={account.profile.id} onSaved={() => account.refresh()} /> : null}
              <div className="auth-field">
                <label htmlFor={bioId}>About me</label>
                <p className="auth-form__hint">Tell people a little about who you are.</p>
                <textarea id={bioId} value={draft.bio} rows={7} maxLength={BIO_MAX} onChange={(event) => patch({ bio: event.target.value })} />
                <CharCount value={draft.bio} max={BIO_MAX} />
              </div>
              {intentGroup ? (
                <SingleChoiceField
                  legend="Relationship intent"
                  name="relationship_intent"
                  options={optionGroupChoices(intentGroup.key, intentGroup.options)}
                  value={draft.selections.relationship_intent?.[0] ?? ""}
                  onChange={(code) => toggleSelection("relationship_intent", code, "single")}
                  disabled={saving}
                  layout="segmented"
                />
              ) : null}
              <div className="auth-field">
                <label htmlFor={lookingId}>I&apos;m looking for</label>
                <textarea
                  id={lookingId}
                  value={draft.lookingFor}
                  rows={4}
                  maxLength={LOOKING_MAX}
                  onChange={(event) => patch({ lookingFor: event.target.value })}
                />
                <CharCount value={draft.lookingFor} max={LOOKING_MAX} />
              </div>
            </section>
          </div>

          <div className={active === "photos" ? undefined : "edit-profile__mobile-hide"} data-edit-section id="photos">
            <EditPhotosSection
              collection={photoCollection}
              onChanged={(photos) => {
                setPreviewPhotos(photos);
                account.refresh();
              }}
            />
          </div>

          <div className={active === "work" ? undefined : "edit-profile__mobile-hide"} data-edit-section id="work">
            <section className="edit-profile__block">
              <header className="edit-profile__block-head">
                <h2>Work &amp; education</h2>
                <p>What you do, in a sentence people can picture.</p>
              </header>
              <div className="edit-profile__grid">
                <div className="auth-field">
                  <label htmlFor={jobId}>Job title</label>
                  <input id={jobId} type="text" value={draft.jobTitle} maxLength={80} onChange={(event) => patch({ jobTitle: event.target.value })} />
                </div>
                <div className="auth-field">
                  <label htmlFor={companyId}>Company</label>
                  <input id={companyId} type="text" value={draft.companyName} maxLength={80} onChange={(event) => patch({ companyName: event.target.value })} />
                  <PrivacyNote>Only you can see this.</PrivacyNote>
                </div>
                <div className="auth-field">
                  <label htmlFor={occupationId}>What you do</label>
                  <input
                    id={occupationId}
                    type="text"
                    value={draft.occupation}
                    maxLength={80}
                    onChange={(event) => patch({ occupation: event.target.value })}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor={schoolId}>School / institution</label>
                  <input id={schoolId} type="text" value={draft.school} maxLength={80} onChange={(event) => patch({ school: event.target.value })} />
                </div>
              </div>
              <OptionSelects
                groups={educationGroups}
                selections={draft.selections}
                onSelect={(key, code) => toggleSelection(key, code, "single")}
                disabled={saving}
              />
              {sectionErrors.options ? (
                <p className="auth-form__error" role="alert">
                  {sectionErrors.options}
                </p>
              ) : null}
            </section>
          </div>

          <div className={active === "lifestyle" ? undefined : "edit-profile__mobile-hide"} data-edit-section id="lifestyle">
            <section className="edit-profile__block">
              <header className="edit-profile__block-head">
                <h2>Lifestyle</h2>
                <p>Small details that help the right person recognise you.</p>
              </header>
              <SingleChoiceField
                legend={field("smoking")?.label ?? "Smoking"}
                name="smoking"
                options={lifestyleChoices("smoking", field("smoking")?.options ?? [])}
                value={draft.smoking}
                onChange={(code) => patch({ smoking: code })}
                disabled={saving}
                layout="segmented"
              />
              <SingleChoiceField
                legend={field("drinking")?.label ?? "Drinking"}
                name="drinking"
                options={lifestyleChoices("drinking", field("drinking")?.options ?? [])}
                value={draft.drinking}
                onChange={(code) => patch({ drinking: code })}
                disabled={saving}
                layout="segmented"
              />
              {field("fitness") ? (
                <SelectField
                  id="edit-fitness"
                  label={field("fitness")!.label}
                  value={draft.fitness}
                  onChange={(value) => patch({ fitness: value })}
                  options={field("fitness")!.options}
                />
              ) : null}
              <div className="auth-field">
                <label htmlFor={heightId}>Height (cm)</label>
                <input
                  id={heightId}
                  type="number"
                  inputMode="numeric"
                  min={100}
                  max={250}
                  value={draft.height}
                  onChange={(event) => patch({ height: event.target.value })}
                />
              </div>
              <OptionSelects
                groups={lifestyleGroups}
                selections={draft.selections}
                onSelect={(key, code) => toggleSelection(key, code, "single")}
                disabled={saving}
              />
            </section>
          </div>

          <div className={active === "dating" ? undefined : "edit-profile__mobile-hide"} data-edit-section id="dating">
            <section className="edit-profile__block">
              <header className="edit-profile__block-head">
                <h2>Dating</h2>
                <p>How you like to date — some of this stays private.</p>
              </header>
              <OptionSelects
                groups={datingGroups}
                selections={draft.selections}
                onSelect={(key, code) => toggleSelection(key, code, "single")}
                disabled={saving}
              />
            </section>
          </div>

          <div className={active === "interests" ? undefined : "edit-profile__mobile-hide"} data-edit-section id="interests">
            <section className="edit-profile__block">
              <header className="edit-profile__block-head">
                <h2>Interests</h2>
                <p>Give people something easy to open with.</p>
              </header>
              {interestGroup ? (
                <InterestsPicker
                  group={interestGroup}
                  selected={draft.selections.interests ?? []}
                  onChange={(codes) =>
                    setDraft((current) =>
                      current ? { ...current, selections: { ...current.selections, interests: codes } } : current,
                    )
                  }
                  disabled={saving}
                />
              ) : (
                <p className="auth-form__hint">Interests aren’t available on your profile yet.</p>
              )}
            </section>
          </div>

          <div className={active === "languages" ? undefined : "edit-profile__mobile-hide"} data-edit-section id="languages">
            <section className="edit-profile__block">
              <header className="edit-profile__block-head">
                <h2>Languages</h2>
                <p>The languages you’re happy to date in.</p>
              </header>
              {languageField ? (
                <LanguagesEditor
                  options={languageField.options}
                  values={draft.languages}
                  onChange={(codes) => patch({ languages: codes })}
                  disabled={saving}
                />
              ) : (
                <p className="auth-form__hint">Language options aren’t available yet.</p>
              )}
            </section>
          </div>

          <div className={active === "prompts" ? undefined : "edit-profile__mobile-hide"} data-edit-section id="prompts">
            <section className="edit-profile__block">
              <header className="edit-profile__block-head">
                <h2>Prompts</h2>
                <p>Personality, not a questionnaire.</p>
              </header>
              {sectionErrors.prompts ? (
                <p className="auth-form__error" role="alert">
                  {sectionErrors.prompts}
                </p>
              ) : null}
              <PromptEditor
                definitions={configuration?.prompts ?? []}
                drafts={draft.prompts}
                onChange={(prompts) => patch({ prompts })}
                pending={saving}
              />
            </section>
          </div>

          <div className={active === "verification" ? undefined : "edit-profile__mobile-hide"} data-edit-section id="verification">
            <section className="edit-profile__block">
              <header className="edit-profile__block-head">
                <h2>Verification</h2>
                <p>Trust signals that DateZA actually supports today.</p>
              </header>
              {verified ? (
                <p className="edit-profile__verified-row">
                  <ShieldCheckIcon /> {VERIFIED_CONTACT_LABEL} ✓
                </p>
              ) : (
                <button type="button" className="edit-strength__cta" onClick={() => openPrompt("profile")}>
                  Verify your contact details
                </button>
              )}
              <p className="edit-profile__coming">RealMe — Coming soon</p>
            </section>
          </div>

          <div className="edit-profile__mobile-only" data-edit-section id="preview">
            {previewOwner ? (
              <EditPreviewCard owner={previewOwner} photos={previewPhotos} configuration={configuration} />
            ) : null}
            <div className="edit-profile__nav-strength">
              <ProfileStrengthCard profileCompletion={account.profile?.profile_completion ?? null} richness={richness} />
            </div>
          </div>

          <ul className="edit-profile__jump-list">
            {otherSections.map((section) => (
              <li key={section.id}>
                <button type="button" onClick={() => goSection(section.id)}>
                  {section.label}
                  <ChevronRightIcon />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="edit-profile__rail">
          {previewOwner ? <EditPreviewCard owner={previewOwner} photos={previewPhotos} configuration={configuration} /> : null}
        </aside>
      </div>

      {dirty || saving || savedFlash ? (
        <div className={`edit-profile__save${dirty ? " is-dirty" : ""}`}>
          <button type="button" className="edit-profile__cancel" onClick={cancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="edit-profile__submit" onClick={() => void save()} disabled={saving || !dirty}>
            {saving ? "Saving…" : savedFlash ? "Saved" : "Save changes"}
          </button>
        </div>
      ) : null}

      {pendingReason ? (
        <Modal ariaLabel="Verify your account" onClose={dismiss}>
          <VerificationFlow onDone={dismiss} />
        </Modal>
      ) : null}
    </div>
  );
}
