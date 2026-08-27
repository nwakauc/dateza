import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  changePassword,
  confirmEmailChange,
  requestEmailChange,
} from "../../lib/api/auth.ts";
import { ApiError } from "../../lib/api/errors.ts";
import { closeCurrentAccount } from "../../lib/api/me.ts";
import {
  getProfileConfiguration,
  getProfilePreferences,
  publishCurrentProfile,
  unpublishCurrentProfile,
  updateProfilePreferences,
} from "../../lib/api/profile.ts";
import type { FieldOption, ProfilePreferences } from "../../lib/api/profileTypes.ts";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../../lib/api/notifications.ts";
import type { NotificationPreferences } from "../../lib/api/notificationTypes.ts";
import { listBlockedProfiles, unblockProfile } from "../../lib/api/safety.ts";
import type { BlockedProfile } from "../../lib/api/safetyTypes.ts";
import { useSignOut } from "../auth/useSignOut.ts";
import { MultiChoiceField } from "../onboarding/ChoiceFields.tsx";
import {
  EVERYONE_UI_CODE,
  interestedChipSelected,
  interestedInDisplayOptions,
  interestedInGenderCodes,
  toggleInterestedIn,
} from "../onboarding/interestedIn.ts";
import { BROAD_PREFERENCE_DEFAULTS } from "../onboarding/presentation.ts";
import { canInteract } from "../session/verificationState.ts";
import { useSession } from "../session/useSession.ts";
import {
  BellIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  GearIcon,
  MapPinIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SlidersIcon,
  UserIcon,
  UsersIcon,
} from "../shell/icons.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";
import { useOwnAccount } from "../shell/useOwnAccount.ts";
import { Modal } from "../verification/Modal.tsx";
import { VerificationFlow } from "../verification/VerificationFlow.tsx";
import { DatingLocationPicker } from "../location/DatingLocationPicker.tsx";
import { hrefForCompletionKey } from "./completionLinks.ts";

const SECTION_IDS = [
  "account",
  "privacy",
  "notifications",
  "preferences",
  "blocked",
  "verification",
  "payments",
  "data",
  "help",
  "about",
] as const;

type SectionId = (typeof SECTION_IDS)[number];

type SectionDefinition = {
  id: SectionId;
  label: string;
  description: string;
  icon: ReactNode;
};

const SECTIONS: SectionDefinition[] = [
  { id: "account", label: "Account", description: "Your details and account access", icon: <UserIcon /> },
  { id: "privacy", label: "Privacy & safety", description: "Visibility and safety controls", icon: <ShieldIcon /> },
  { id: "notifications", label: "Notifications", description: "Your DateZA updates", icon: <BellIcon /> },
  { id: "preferences", label: "Preferences", description: "Who and where you want to date", icon: <SlidersIcon /> },
  { id: "blocked", label: "Blocked users", description: "Manage blocked members", icon: <UsersIcon /> },
  { id: "verification", label: "Verification", description: "Your contact verification", icon: <ShieldCheckIcon /> },
  { id: "payments", label: "Payment & plans", description: "Plans and payment details", icon: <GearIcon /> },
  { id: "data", label: "Data & permissions", description: "Your data and browser permissions", icon: <EyeIcon /> },
  { id: "help", label: "Help & support", description: "Safety and product help", icon: <ShieldIcon /> },
  { id: "about", label: "About DateZA", description: "Product and legal information", icon: <GearIcon /> },
];

function sectionFromHash(hash: string): SectionId | null {
  const value = hash.replace(/^#/, "");
  return SECTION_IDS.includes(value as SectionId) ? (value as SectionId) : null;
}

function SettingsRow({
  title,
  hint,
  status,
  to,
  onClick,
  icon,
}: {
  title: string;
  hint?: string;
  status?: string;
  to?: string;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  const content = (
    <>
      {icon ? <span className="settings-row__icon">{icon}</span> : null}
      <span className="settings-row__body">
        <strong>{title}</strong>
        {hint ? <span>{hint}</span> : null}
      </span>
      {status ? <span className="settings-row__status">{status}</span> : null}
      {to || onClick ? <ChevronRightIcon className="settings-row__chevron" /> : null}
    </>
  );
  return to ? (
    <Link className="settings-row" to={to}>{content}</Link>
  ) : onClick ? (
    <button className="settings-row" type="button" onClick={onClick}>{content}</button>
  ) : (
    <div className="settings-row settings-row--static">{content}</div>
  );
}

function SettingsToggle({
  title,
  hint,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="settings-row settings-row--toggle">
      <span className="settings-row__body">
        <strong>{title}</strong>
        <span>{hint}</span>
      </span>
      <button
        type="button"
        className={`notifications-switch${checked ? " notifications-switch--on" : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      />
    </div>
  );
}

function SettingsSection({
  id,
  title,
  description,
  icon,
  active,
  children,
}: {
  id: SectionId;
  title: string;
  description: string;
  icon: ReactNode;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`settings-card${active ? " settings-card--active" : ""}`}
      id={id}
      aria-labelledby={`${id}-title`}
    >
      <div className="settings-card__heading">
        <span className="settings-card__heading-icon">{icon}</span>
        <span>
          <h2 id={`${id}-title`}>{title}</h2>
          <p>{description}</p>
        </span>
      </div>
      <div className="settings-card__content">{children}</div>
    </section>
  );
}

function SettingsSkeleton() {
  return (
    <div className="settings-skeleton" aria-label="Loading settings">
      <span />
      <span />
      <span />
    </div>
  );
}

function errorCopy(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code === "invalid_current_password") return "Your current password is incorrect.";
  if (error.code === "password_credential_required") return "This account does not use a password credential.";
  if (error.code === "verification_code_invalid") return "That verification code is incorrect.";
  if (error.code === "verification_code_expired") return "That verification code has expired. Request a new one.";
  return fallback;
}

function PasswordChangeForm({ onDone }: { onDone: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [phase, setPhase] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase === "saving") return;
    if (password !== confirmation) {
      setMessage("New passwords do not match.");
      setPhase("error");
      return;
    }
    setPhase("saving");
    setMessage(undefined);
    try {
      await changePassword(currentPassword, password, confirmation);
      onDone();
    } catch (error) {
      setMessage(errorCopy(error, "We couldn't change your password. Check the details and try again."));
      setPhase("error");
    }
  }

  return (
    <form className="settings-dialog-form" onSubmit={(event) => void submit(event)}>
      <h2>Change password</h2>
      <p>Changing your password signs out other sessions connected to this password.</p>
      <label>Current password<input autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
      <label>New password<input autoComplete="new-password" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <label>Confirm new password<input autoComplete="new-password" type="password" minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
      {message ? <p className="settings-form-error" role="alert">{message}</p> : null}
      <button className="settings-save" type="submit" disabled={phase === "saving"}>{phase === "saving" ? "Changing…" : "Change password"}</button>
    </form>
  );
}

function EmailChangeForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"request" | "confirm">("request");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage(undefined);
    try {
      if (step === "request") {
        await requestEmailChange(email, currentPassword);
        setStep("confirm");
      } else {
        await confirmEmailChange(email, code);
        onDone();
      }
    } catch (error) {
      setMessage(errorCopy(error, "We couldn't update your email. Check the details and try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="settings-dialog-form" onSubmit={(event) => void submit(event)}>
      <h2>Change email</h2>
      <p>{step === "request" ? "We'll send a verification code to your new email." : `Enter the code sent to ${email}.`}</p>
      {step === "request" ? (
        <>
          <label>New email<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Current password<input autoComplete="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
        </>
      ) : (
        <label>Verification code<input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value)} required /></label>
      )}
      {message ? <p className="settings-form-error" role="alert">{message}</p> : null}
      <button className="settings-save" type="submit" disabled={pending}>{pending ? "Saving…" : step === "request" ? "Send code" : "Confirm email"}</button>
    </form>
  );
}

function CloseAccountForm({ onClose }: { onClose: () => Promise<void> }) {
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== "close" || pending) return;
    setPending(true);
    try {
      await closeCurrentAccount();
      await onClose();
    } catch {
      setMessage("We couldn't close your DateZA account. Nothing was changed. Try again.");
      setPending(false);
    }
  }

  return (
    <form className="settings-dialog-form settings-dialog-form--danger" onSubmit={(event) => void submit(event)}>
      <h2>Close DateZA account</h2>
      <p>This permanently closes your DateZA membership, removes your dating profile, ends matches and signs you out everywhere on DateZA. It does not affect accounts you may hold with other services.</p>
      <label>Type “close” to confirm<input autoComplete="off" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
      {message ? <p className="settings-form-error" role="alert">{message}</p> : null}
      <button className="settings-danger-action" type="submit" disabled={confirmation !== "close" || pending}>{pending ? "Closing account…" : "Close account permanently"}</button>
    </form>
  );
}

export default function SettingsPage() {
  const account = useOwnAccount();
  const { session, verification, refreshSession } = useSession();
  const { signOut, pending: signingOut } = useSignOut();
  const location = useLocation();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<ProfilePreferences | null>();
  const [draft, setDraft] = useState<ProfilePreferences | null>(null);
  const [interestedOptions, setInterestedOptions] = useState<FieldOption[]>([]);
  const [loadingPreferences, setLoadingPreferences] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [savePhase, setSavePhase] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [accountDialog, setAccountDialog] = useState<"password" | "email" | "close" | null>(null);
  const [blockedProfiles, setBlockedProfiles] = useState<BlockedProfile[]>();
  const [blockedError, setBlockedError] = useState<string>();
  const [unblockingId, setUnblockingId] = useState<string>();
  const [pausePhase, setPausePhase] = useState<"idle" | "saving" | "error">("idle");
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [notificationPrefsError, setNotificationPrefsError] = useState<string>();
  const [notificationPrefsSaving, setNotificationPrefsSaving] = useState<"product_email_enabled" | "push_enabled" | null>(null);
  const [notificationPrefsSaveError, setNotificationPrefsSaveError] = useState<string>();
  const [notificationPrefsAttempt, setNotificationPrefsAttempt] = useState(0);
  const activeSection = sectionFromHash(location.hash);

  useEffect(() => {
    document.title = "Settings — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  useEffect(() => {
    if (!activeSection) return;
    if (typeof window.matchMedia !== "function" || !window.matchMedia("(min-width: 768px)").matches) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(activeSection)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeSection]);

  useEffect(() => {
    let cancelled = false;
    void listBlockedProfiles()
      .then((blocks) => {
        if (!cancelled) setBlockedProfiles(blocks);
      })
      .catch(() => {
        if (!cancelled) setBlockedError("We couldn't load your blocked users. Try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getNotificationPreferences()
      .then((prefs) => {
        if (cancelled) return;
        setNotificationPrefs(prefs);
        setNotificationPrefsError(undefined);
      })
      .catch(() => {
        if (!cancelled) setNotificationPrefsError("We couldn't load your notification settings. Try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [notificationPrefsAttempt]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getProfilePreferences(), getProfileConfiguration()])
      .then(([stored, configuration]) => {
        if (cancelled) return;
        const next = stored ?? {
          ...BROAD_PREFERENCE_DEFAULTS,
          interested_in: [],
        };
        const field = configuration.configuration.preference_fields.find((item) => item.key === "interested_in");
        setPreferences(next);
        setDraft(next);
        setInterestedOptions(field?.options ?? []);
      })
      .catch(() => {
        if (!cancelled) setLoadError("We couldn't load your dating preferences. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPreferences(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function openSection(id: SectionId) {
    navigate({ pathname: "/settings", hash: id });
  }

  function backToSettings() {
    navigate("/settings");
  }

  async function savePreferences() {
    if (!draft || savePhase === "saving") return;
    const minAge = draft.min_age ?? BROAD_PREFERENCE_DEFAULTS.min_age;
    const maxAge = draft.max_age ?? BROAD_PREFERENCE_DEFAULTS.max_age;
    const maxDistance = draft.max_distance_km ?? BROAD_PREFERENCE_DEFAULTS.max_distance_km;
    if (minAge < 18 || maxAge > 120 || minAge > maxAge || maxDistance < 1 || maxDistance > 500) {
      setSavePhase("error");
      return;
    }
    setSavePhase("saving");
    try {
      await updateProfilePreferences({
        min_age: minAge,
        max_age: maxAge,
        max_distance_km: maxDistance,
        interested_in: draft.interested_in,
      });
      setPreferences(draft);
      setSavePhase("saved");
    } catch {
      setSavePhase("error");
    }
  }

  async function toggleDatingVisibility() {
    if (pausePhase === "saving") return;
    setPausePhase("saving");
    try {
      if (profileVisible) await unpublishCurrentProfile();
      else await publishCurrentProfile();
      account.refresh();
      setPausePhase("idle");
    } catch {
      setPausePhase("error");
    }
  }

  async function toggleNotificationPreference(key: "product_email_enabled" | "push_enabled", next: boolean) {
    if (!notificationPrefs || notificationPrefsSaving) return;
    const previous = notificationPrefs;
    setNotificationPrefs({ ...notificationPrefs, [key]: next });
    setNotificationPrefsSaving(key);
    setNotificationPrefsSaveError(undefined);
    try {
      const saved = await updateNotificationPreferences({ [key]: next });
      setNotificationPrefs(saved);
    } catch {
      setNotificationPrefs(previous);
      setNotificationPrefsSaveError("We couldn't update that setting. Try again.");
    } finally {
      setNotificationPrefsSaving(null);
    }
  }

  async function unblock(profileId: string) {
    if (unblockingId) return;
    setUnblockingId(profileId);
    setBlockedError(undefined);
    try {
      await unblockProfile(profileId);
      setBlockedProfiles((current) => current?.filter((item) => item.profile.id !== profileId));
    } catch {
      setBlockedError("We couldn't unblock this member. Try again.");
    } finally {
      setUnblockingId(undefined);
    }
  }

  const verified = canInteract(verification) || account.profile?.contact_verified === true;
  const maskedContact = verification.status === "known" ? verification.maskedDestination : undefined;
  const contactKind = verification.status === "known" ? verification.kind : undefined;
  const profileVisible = account.onboarding?.profile_published === true && account.profile?.visibility === "visible";
  const completion = account.profile?.profile_completion ?? null;
  const displayInterestedOptions = interestedInDisplayOptions(interestedOptions);
  const interestedCodes = interestedInGenderCodes(interestedOptions);
  const preferencesChanged =
    draft != null &&
    preferences != null &&
    (draft.min_age !== preferences.min_age ||
      draft.max_age !== preferences.max_age ||
      draft.max_distance_km !== preferences.max_distance_km ||
      draft.interested_in.join("|") !== preferences.interested_in.join("|"));

  return (
    <div className={`shell-page settings-page${activeSection ? " settings-page--section-selected" : ""}`}>
      <div className="shell-page__header">
        {activeSection ? (
          <button className="settings-mobile-back" type="button" onClick={backToSettings}>
            <ChevronLeftIcon /> Settings
          </button>
        ) : null}
        <h1 className="shell-page__title">Settings</h1>
        <p className="shell-page__subtitle">Manage your account, privacy and dating experience.</p>
      </div>

      <div className="settings-mobile-owner">
        <span className="settings-owner-avatar">
          {account.avatarUrl ? <img src={account.avatarUrl} alt="" width="48" height="48" /> : account.initial}
        </span>
        <span>
          <strong>{account.displayName || "Your profile"}</strong>
          <Link to="/profile">View profile</Link>
        </span>
      </div>

      <div className="settings-layout">
        <aside className="settings-nav" aria-label="Settings sections">
          <p className="settings-nav__title">Settings</p>
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={activeSection === section.id ? "settings-nav__item settings-nav__item--active" : "settings-nav__item"}
              onClick={() => openSection(section.id)}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
          <button className="settings-nav__logout" type="button" disabled={signingOut} onClick={() => void signOut()}>
            {signingOut ? "Signing out…" : "Log out"}
          </button>
        </aside>

        <nav className="settings-mobile-nav" aria-label="Settings sections">
          {SECTIONS.map((section) => (
            <button key={section.id} type="button" onClick={() => openSection(section.id)}>
              <span className="settings-mobile-nav__icon">{section.icon}</span>
              <span>
                <strong>{section.label}</strong>
                <small>{section.description}</small>
              </span>
              <ChevronRightIcon />
            </button>
          ))}
          <button className="settings-mobile-logout" type="button" disabled={signingOut} onClick={() => void signOut()}>
            {signingOut ? "Signing out…" : "Log out"}
          </button>
        </nav>

        <main className="settings-content">
          <SettingsSection id="account" title="Account" description="Update your personal details and manage your account." icon={<UserIcon />} active={activeSection === "account"}>
            <SettingsRow title="Edit profile" hint="Manage how you appear on DateZA" to="/profile/edit" />
            <SettingsRow
              title={contactKind === "phone" ? "Phone" : "Email"}
              hint={maskedContact ?? "Contact details unavailable"}
              status={verified ? "Verified" : "Verification needed"}
              onClick={contactKind === "email" ? () => setAccountDialog("email") : undefined}
            />
            <SettingsRow title="Change password" hint="Update your password and sign out other password sessions" onClick={() => setAccountDialog("password")} />
            <SettingsRow title="Close account" hint="Permanently close your DateZA membership" onClick={() => setAccountDialog("close")} />
          </SettingsSection>

          <SettingsSection id="privacy" title="Privacy & safety" description="Understand your visibility and keep your account secure." icon={<ShieldIcon />} active={activeSection === "privacy"}>
            <SettingsRow
              title={profileVisible ? "Profile visible" : "Profile hidden"}
              hint={profileVisible ? "Your published profile can appear to other members." : "Your profile is not currently visible to other members."}
              status={profileVisible ? "Visible" : "Hidden"}
            />
            <button className="settings-secondary-action" type="button" disabled={pausePhase === "saving"} onClick={() => void toggleDatingVisibility()}>
              {pausePhase === "saving" ? "Saving…" : profileVisible ? "Pause dating" : "Resume dating"}
            </button>
            {pausePhase === "error" ? <p className="settings-form-error" role="alert">We couldn't update your profile visibility. Try again.</p> : null}
            <SettingsRow title="Private mode" hint="DateZA does not yet support a private browsing mode" status="Unavailable" />
            <SettingsRow title="Block and report" hint="Use the safety menu on a member's profile or conversation" to="/settings/safety" />
            <SettingsRow title="Safety centre" hint="Practical guidance for safer dating" to="/settings/safety" />
          </SettingsSection>

          <SettingsSection id="notifications" title="Notifications" description="Choose how DateZA can reach you. These settings apply to DateZA only." icon={<BellIcon />} active={activeSection === "notifications"}>
            <SettingsRow title="In-app notifications" hint="Updates stay in DateZA and on your notification bell" to="/notifications" />
            {notificationPrefsError ? (
              <div className="settings-inline-error" role="alert">
                <p>{notificationPrefsError}</p>
                <button type="button" onClick={() => setNotificationPrefsAttempt((current) => current + 1)}>Try again</button>
              </div>
            ) : notificationPrefs ? (
              <>
                <SettingsToggle
                  title="Email notifications"
                  hint="Email DateZA updates to your account email. Turning this off does not hide in-app notifications."
                  checked={notificationPrefs.product_email_enabled}
                  disabled={notificationPrefsSaving !== null}
                  onChange={(next) => void toggleNotificationPreference("product_email_enabled", next)}
                />
                <SettingsToggle
                  title="Push notifications"
                  hint="Allow DateZA to send push alerts when a device is registered. This browser is not registered for push yet."
                  checked={notificationPrefs.push_enabled}
                  disabled={notificationPrefsSaving !== null}
                  onChange={(next) => void toggleNotificationPreference("push_enabled", next)}
                />
                {notificationPrefsSaveError ? <p className="settings-form-error" role="alert">{notificationPrefsSaveError}</p> : null}
              </>
            ) : (
              <p className="settings-row__status">Loading notification settings…</p>
            )}
          </SettingsSection>

          <SettingsSection id="preferences" title="Dating preferences" description="Choose who DateZA looks for around your dating location." icon={<SlidersIcon />} active={activeSection === "preferences"}>
            {loadingPreferences ? <SettingsSkeleton /> : loadError ? (
              <div className="settings-inline-error" role="alert">
                <p>{loadError}</p>
                <button type="button" onClick={() => window.location.reload()}>Try again</button>
              </div>
            ) : draft ? (
              <div className="settings-preferences">
                <MultiChoiceField
                  legend="Interested in"
                  name="settings-interested-in"
                  options={displayInterestedOptions}
                  values={draft.interested_in}
                  onChange={(codes) => setDraft((current) => (current ? { ...current, interested_in: codes } : current))}
                  isSelected={(code) => interestedChipSelected(draft.interested_in, code, interestedCodes)}
                  onToggle={(code) => setDraft((current) => current ? {
                    ...current,
                    interested_in: toggleInterestedIn(
                      current.interested_in,
                      code === EVERYONE_UI_CODE ? EVERYONE_UI_CODE : code,
                      interestedCodes,
                    ),
                  } : current)}
                  disabled={savePhase === "saving"}
                />
                <fieldset>
                  <legend>Age range</legend>
                  <div className="settings-age-fields">
                    <label>From<input name="minimum-age" autoComplete="off" type="number" min="18" max="120" value={draft.min_age ?? 18} onChange={(event) => setDraft({ ...draft, min_age: Number(event.target.value) })} /></label>
                    <span>to</span>
                    <label>To<input name="maximum-age" autoComplete="off" type="number" min="18" max="120" value={draft.max_age ?? 120} onChange={(event) => setDraft({ ...draft, max_age: Number(event.target.value) })} /></label>
                  </div>
                </fieldset>
                <fieldset>
                  <div className="settings-range-label">
                    <legend>Distance</legend>
                    <output>{draft.max_distance_km ?? 500} km</output>
                  </div>
                  <input
                    className="settings-distance"
                    type="range"
                    name="maximum-distance"
                    min="1"
                    max="500"
                    value={draft.max_distance_km ?? 500}
                    onChange={(event) => setDraft({ ...draft, max_distance_km: Number(event.target.value) })}
                    aria-label="Maximum dating distance in kilometres"
                  />
                  <p>How far from your chosen dating location DateZA should look.</p>
                </fieldset>
                <fieldset>
                  <legend>Dating location</legend>
                  <div className="settings-location-summary">
                    <MapPinIcon />
                    <span>
                      <strong>Dating location</strong>
                      <small>Your exact location is never shown.</small>
                    </span>
                  </div>
                  {account.profile ? (
                    <DatingLocationPicker
                      compact
                      savedLabel={account.profile.location?.place?.display_path}
                      configuredWithoutPlace={
                        account.profile.location?.configured === true && !account.profile.location.place
                      }
                      onSaved={() => {
                        setLocationSaved(true);
                        void account.refresh();
                      }}
                    />
                  ) : null}
                  {locationSaved ? <p className="settings-saved" role="status">Dating location updated.</p> : null}
                </fieldset>
                {savePhase === "error" ? <p className="settings-form-error" role="alert">We couldn't save your preferences. Check the age range and try again.</p> : null}
                {savePhase === "saved" ? <p className="settings-saved" role="status">Preferences saved.</p> : null}
                <button className="settings-save" type="button" disabled={!preferencesChanged || savePhase === "saving"} onClick={() => void savePreferences()}>
                  {savePhase === "saving" ? "Saving…" : "Save changes"}
                </button>
              </div>
            ) : null}
          </SettingsSection>

          <SettingsSection id="blocked" title="Blocked users" description="Manage members you have blocked." icon={<UsersIcon />} active={activeSection === "blocked"}>
            {blockedProfiles === undefined && !blockedError ? <SettingsSkeleton /> : null}
            {blockedError ? <p className="settings-form-error" role="alert">{blockedError}</p> : null}
            {blockedProfiles?.length === 0 ? <div className="settings-unavailable"><strong>No blocked users</strong><p>People you block will appear here without exposing their full profile.</p></div> : null}
            {blockedProfiles?.map((block) => (
              <div className="settings-blocked-row" key={block.profile.id}>
                <span aria-hidden="true">{block.profile.display_name.trim()[0]?.toUpperCase() ?? "D"}</span>
                <strong>{block.profile.display_name}</strong>
                <button type="button" disabled={unblockingId === block.profile.id} onClick={() => void unblock(block.profile.id)}>
                  {unblockingId === block.profile.id ? "Unblocking…" : "Unblock"}
                </button>
              </div>
            ))}
          </SettingsSection>

          <SettingsSection id="verification" title="Verification" description="See the verification DateZA can confirm today." icon={<ShieldCheckIcon />} active={activeSection === "verification"}>
            <SettingsRow title={VERIFIED_CONTACT_LABEL} hint={maskedContact ?? "Your sign-in contact"} status={verified ? "Verified" : "Pending"} />
            {!verified ? <button className="settings-primary-action" type="button" onClick={() => setVerificationOpen(true)}>Verify contact</button> : null}
            <SettingsRow title="RealMe" hint="Identity and photo verification are not available yet" status="Coming later" />
          </SettingsSection>

          <SettingsSection id="payments" title="Payment & plans" description="Plans, subscriptions and billing." icon={<GearIcon />} active={activeSection === "payments"}>
            <div className="settings-unavailable">
              <strong>DateZA Premium is not available</strong>
              <p>DateZA does not currently offer paid plans, subscriptions or payment controls. There is nothing to buy or manage yet.</p>
            </div>
          </SettingsSection>

          <SettingsSection id="data" title="Data & permissions" description="Understand what DateZA can access and manage your data." icon={<EyeIcon />} active={activeSection === "data"}>
            <SettingsRow title="Dating location" hint="Only used for distance-based matching; precise coordinates are never shown to members" />
            <SettingsRow title="Notification permission" hint="DateZA has not registered browser push notifications" status="Not requested" />
            <SettingsRow title="Download my data" hint="A secure data export is not available yet" status="Unavailable" />
          </SettingsSection>

          <SettingsSection id="help" title="Help & support" description="Get safety guidance and product help." icon={<ShieldIcon />} active={activeSection === "help"}>
            <SettingsRow title="Safety centre" hint="How to block, report and date more safely" to="/settings/safety" />
            <SettingsRow title="Help centre" hint="A public DateZA help centre has not been published yet" status="Unavailable" />
            <SettingsRow title="Contact support" hint="A verified support channel has not been published yet" status="Unavailable" />
          </SettingsSection>

          <SettingsSection id="about" title="About DateZA" description="Product information and policies." icon={<GearIcon />} active={activeSection === "about"}>
            <SettingsRow title="About DateZA" hint="A South African dating experience built around meaningful connection" />
            <SettingsRow title="Terms" hint="Terms have not been published yet" status="Unavailable" />
            <SettingsRow title="Privacy policy" hint="The public privacy policy has not been published yet" status="Unavailable" />
            <SettingsRow title="Community guidelines" hint="Community guidelines have not been published yet" status="Unavailable" />
            <SettingsRow title="Version" status={import.meta.env.VITE_APP_VERSION || "0.0.1"} />
          </SettingsSection>
        </main>

        <aside className="settings-context" aria-label="Account overview">
          {completion ? (
            <section className="settings-strength">
              <h2>Profile strength</h2>
              <div className="settings-strength__score">
                <span>{Math.max(0, Math.min(100, Math.round(completion.percent)))}%</span>
                <small>Complete</small>
              </div>
              <p>More details can help people get to know you.</p>
              {completion.suggestions.length > 0 ? (
                <ul>
                  {completion.suggestions.slice(0, 4).map((suggestion) => (
                    <li key={suggestion.key}><Link to={hrefForCompletionKey(suggestion.key)}>{suggestion.label}</Link></li>
                  ))}
                </ul>
              ) : null}
              {completion.suggestions[0] ? <Link className="settings-context__cta" to={hrefForCompletionKey(completion.suggestions[0].key)}>See suggestions</Link> : null}
            </section>
          ) : null}
          <section className="settings-status">
            <h2>Account status</h2>
            <p><ShieldCheckIcon /><span><strong>{verified ? VERIFIED_CONTACT_LABEL : "Verification pending"}</strong><small>{verified ? "Your contact details are verified." : "Verify your sign-in contact to interact."}</small></span></p>
            <p><EyeIcon /><span><strong>{profileVisible ? "Profile visible" : "Profile hidden"}</strong><small>{profileVisible ? "Your profile can appear to others." : "Your profile is not appearing to others."}</small></span></p>
            {session.status === "authenticated" ? <p><GearIcon /><span><strong>Session active</strong><small>This browser is signed in securely.</small></span></p> : null}
          </section>
        </aside>
      </div>

      {verificationOpen ? (
        <Modal ariaLabel="Verify your contact" onClose={() => setVerificationOpen(false)}>
          <VerificationFlow onDone={() => setVerificationOpen(false)} />
        </Modal>
      ) : null}
      {accountDialog ? (
        <Modal
          ariaLabel={accountDialog === "password" ? "Change password" : accountDialog === "email" ? "Change email" : "Close account"}
          onClose={() => setAccountDialog(null)}
        >
          {accountDialog === "password" ? <PasswordChangeForm onDone={() => setAccountDialog(null)} /> : null}
          {accountDialog === "email" ? (
            <EmailChangeForm
              onDone={() => {
                setAccountDialog(null);
                void refreshSession();
              }}
            />
          ) : null}
          {accountDialog === "close" ? <CloseAccountForm onClose={signOut} /> : null}
        </Modal>
      ) : null}
    </div>
  );
}
