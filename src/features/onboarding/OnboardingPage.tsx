import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { ApiError } from "../../lib/api/errors.ts";
import {
  getCurrentProfile,
  getProfileConfiguration,
  getProfileLocation,
  getProfilePreferences,
  publishCurrentProfile,
  replaceProfileOptions,
  updateCurrentProfile,
  updateProfilePreferences,
} from "../../lib/api/profile.ts";
import type {
  ConfiguredField,
  ConfiguredOptionGroup,
  OwnerProfile,
  ProfileConfiguration,
  ProfileOnboardingStatus,
} from "../../lib/api/profileTypes.ts";
import { SessionStatusPage } from "../session/SessionStatusPage.tsx";
import {
  HIDDEN_OPTIONS_GROUP_KEYS,
  hiddenGroupDefaultSelection,
  memberDestination,
  optionsScreenForGroup,
  optionsScreenForMissing,
  OPTIONS_SCREEN_ORDER,
  PROFILE_SCREEN_KEYS,
  PROFILE_SCREEN_ORDER,
  profileScreenForMissing,
  type OptionsScreen,
  type ProfileScreen,
} from "./destination.ts";
import { LocationStep } from "./LocationStep.tsx";
import { OnboardingShell } from "./OnboardingShell.tsx";
import { onboardingErrorMessage } from "./onboardingErrors.ts";
import { OptionsForm } from "./OptionsForm.tsx";
import { PhotosStep } from "./PhotosStep.tsx";
import { PreferencesForm } from "./PreferencesForm.tsx";
import { BROAD_PREFERENCE_DEFAULTS } from "./presentation.ts";
import { PublishStep } from "./PublishStep.tsx";
import { SchemaFieldsForm } from "./SchemaFieldsForm.tsx";

const PROFILE_SCREEN_COPY: Record<ProfileScreen, { title: string; intro: string }> = {
  identity: {
    title: "What's your name?",
    intro: "",
  },
  basics: {
    title: "Let's start with you",
    intro: "Your name, birthday, and how you identify.",
  },
  where: {
    title: "Where are you based?",
    intro: "We show your city and country, never an exact pin.",
  },
  location: {
    title: "Where are you dating from?",
    intro: "We use your general area to show people nearby. Your exact location is never shown.",
  },
  about: {
    title: "Tell us a little about yourself",
    intro: "A few honest sentences beat a perfect bio.",
  },
  lifestyle: {
    title: "A little about your lifestyle",
    intro: "Helps us match you well.",
  },
};

const OPTIONS_SCREEN_COPY: Record<OptionsScreen, { title: string; intro: string }> = {
  intent: {
    title: "What are you looking for?",
    intro: "",
  },
  family: {
    title: "Family plans",
    intro: "Helps us match you with people who want the same things.",
  },
  more: {
    title: "A bit more about you",
    intro: "A few quick details that shape your matches.",
  },
};

function valuesFromProfile(
  profile: OwnerProfile | null,
  keys: readonly string[],
): Record<string, string> {
  const source = profile as unknown as Record<string, unknown> | null;
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = source?.[key];
    values[key] = typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
  }
  return values;
}

type ProfileValuesByScreen = Record<ProfileScreen, Record<string, string>>;

function emptyProfileValues(): ProfileValuesByScreen {
  return { identity: {}, basics: {}, where: {}, location: {}, about: {}, lifestyle: {} };
}

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState<string | undefined>();
  const [configuration, setConfiguration] = useState<ProfileConfiguration | undefined>();
  const [onboarding, setOnboarding] = useState<ProfileOnboardingStatus | undefined>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [details, setDetails] = useState<Record<string, string[]> | undefined>();
  const [profileValues, setProfileValues] = useState<ProfileValuesByScreen>(emptyProfileValues());
  const [profileScreen, setProfileScreen] = useState<ProfileScreen>("basics");
  const [interestedIn, setInterestedIn] = useState<string[]>([]);
  const [optionSelections, setOptionSelections] = useState<Record<string, string[]>>({});
  const [optionsScreen, setOptionsScreen] = useState<OptionsScreen>("intent");
  const [holdPhotos, setHoldPhotos] = useState(false);
  const [profileId, setProfileId] = useState<string | undefined>();
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const applyProfile = useCallback((nextProfile: OwnerProfile | null, nextOnboarding: ProfileOnboardingStatus) => {
    setOnboarding(nextOnboarding);
    setProfileValues({
      identity: valuesFromProfile(nextProfile, PROFILE_SCREEN_KEYS.identity),
      basics: valuesFromProfile(nextProfile, PROFILE_SCREEN_KEYS.basics),
      where: valuesFromProfile(nextProfile, PROFILE_SCREEN_KEYS.where),
      location: {},
      about: valuesFromProfile(nextProfile, PROFILE_SCREEN_KEYS.about),
      lifestyle: valuesFromProfile(nextProfile, PROFILE_SCREEN_KEYS.lifestyle),
    });
    setProfileScreen(profileScreenForMissing(nextOnboarding.completion.missing));
    setOptionSelections(nextProfile?.options ?? {});
    setOptionsScreen(optionsScreenForMissing(nextOnboarding.completion.missing));
    setProfileId(nextProfile?.id);
    if (nextProfile?.location?.configured === true) {
      setLocationConfirmed(true);
    } else if (nextProfile?.location?.configured === false) {
      setLocationConfirmed(false);
    } else if (nextProfile) {
      void getProfileLocation()
        .then((status) => setLocationConfirmed(status.configured))
        .catch(() => setLocationConfirmed(false));
    } else {
      setLocationConfirmed(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Set up your profile — DateZA";
    let cancelled = false;

    async function load() {
      try {
        const [configResponse, profileResponse] = await Promise.all([
          getProfileConfiguration(),
          getCurrentProfile(),
        ]);
        if (cancelled) {
          return;
        }
        setConfiguration(configResponse.configuration);
        applyProfile(profileResponse.profile, profileResponse.onboarding);
        if (profileResponse.onboarding.next_step === "photos") {
          setHoldPhotos(true);
        }
        if (profileResponse.onboarding.next_step === "preferences") {
          const currentPreferences = await getProfilePreferences();
          if (!cancelled) {
            setInterestedIn(currentPreferences?.interested_in ?? []);
          }
        }
      } catch (caught) {
        if (!cancelled) {
          setUnavailable(onboardingErrorMessage(caught));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, [applyProfile]);

  const percent = onboarding?.completion.percent ?? 0;

  const profileFieldsByScreen = useMemo(() => {
    const byScreen: Record<ProfileScreen, ConfiguredField[]> = {
      identity: [],
      basics: [],
      where: [],
      location: [],
      about: [],
      lifestyle: [],
    };
    const fields = [...(configuration?.identity_fields ?? []), ...(configuration?.profile_fields ?? [])];
    for (const field of fields) {
      for (const screen of PROFILE_SCREEN_ORDER) {
        if (PROFILE_SCREEN_KEYS[screen].includes(field.key)) {
          byScreen[screen].push(field);
          break;
        }
      }
    }
    return byScreen;
  }, [configuration]);

  const requiredOptionGroups = useMemo(
    () => (configuration?.option_groups ?? []).filter((group) => group.required),
    [configuration],
  );
  const optionGroupsByScreen = useMemo(() => {
    const byScreen: Record<OptionsScreen, ConfiguredOptionGroup[]> = {
      intent: [],
      family: [],
      more: [],
    };
    for (const group of requiredOptionGroups) {
      if (HIDDEN_OPTIONS_GROUP_KEYS.has(group.key)) {
        continue;
      }
      byScreen[optionsScreenForGroup(group.key)].push(group);
    }
    return byScreen;
  }, [requiredOptionGroups]);
  const interestedField = useMemo(
    () => configuration?.preference_fields.find((field) => field.key === "interested_in"),
    [configuration],
  );

  async function saveProfile(screen: ProfileScreen) {
    if (pending) {
      return;
    }
    setPending(true);
    setError(undefined);
    setDetails(undefined);
    try {
      const values = profileValues[screen];
      const body: Record<string, string> = {};
      for (const [key, value] of Object.entries(values)) {
        body[key] = key === "country_code" ? value.trim().toUpperCase() : value.trim();
      }
      const result = await updateCurrentProfile(body as Parameters<typeof updateCurrentProfile>[0]);
      applyProfile(result.profile, result.onboarding);
      if (result.onboarding.next_step === "preferences") {
        const currentPreferences = await getProfilePreferences();
        setInterestedIn(currentPreferences?.interested_in ?? []);
      }
    } catch (caught) {
      const nextDetails = caught instanceof ApiError ? caught.details : undefined;
      setDetails(nextDetails);
      setError(nextDetails ? undefined : onboardingErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function savePreferences() {
    if (pending) {
      return;
    }
    if (interestedIn.length === 0) {
      setError("Choose at least one option.");
      return;
    }
    setPending(true);
    setError(undefined);
    setDetails(undefined);
    try {
      await updateProfilePreferences({
        ...BROAD_PREFERENCE_DEFAULTS,
        interested_in: interestedIn,
      });
      const result = await getCurrentProfile();
      if (result.onboarding.next_step === "preferences") {
        setOnboarding(result.onboarding);
        setError("We saved that, but this step is still incomplete. Try choosing who you want to meet again.");
        return;
      }
      applyProfile(result.profile, result.onboarding);
      if (result.onboarding.next_step === "photos") {
        setHoldPhotos(true);
      }
    } catch (caught) {
      setError(onboardingErrorMessage(caught));
      setDetails(caught instanceof ApiError ? caught.details : undefined);
    } finally {
      setPending(false);
    }
  }

  async function continueOptions() {
    if (pending) {
      return;
    }
    const index = OPTIONS_SCREEN_ORDER.indexOf(optionsScreen);
    if (index < OPTIONS_SCREEN_ORDER.length - 1) {
      setOptionsScreen(OPTIONS_SCREEN_ORDER[index + 1]);
      setError(undefined);
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const selections: Record<string, string[]> = {};
      for (const group of requiredOptionGroups) {
        const chosen = optionSelections[group.key] ?? [];
        selections[group.key] =
          chosen.length === 0 && HIDDEN_OPTIONS_GROUP_KEYS.has(group.key)
            ? hiddenGroupDefaultSelection(group.options)
            : chosen;
      }
      await replaceProfileOptions(selections);
      const result = await getCurrentProfile();
      applyProfile(result.profile, result.onboarding);
    } catch (caught) {
      setError(onboardingErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  async function publish() {
    if (pending) {
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      await publishCurrentProfile();
      const result = await getCurrentProfile();
      applyProfile(result.profile, result.onboarding);
    } catch (caught) {
      setError(onboardingErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }

  function toggleOption(
    groupKey: string,
    code: string,
    cardinality: "single" | "multiple",
  ) {
    setOptionSelections((current) => {
      const existing = current[groupKey] ?? [];
      if (cardinality === "single") {
        return { ...current, [groupKey]: [code] };
      }
      const next = existing.includes(code)
        ? existing.filter((item) => item !== code)
        : [...existing, code];
      return { ...current, [groupKey]: next };
    });
  }

  async function reconcileProfile() {
    const result = await getCurrentProfile();
    applyProfile(result.profile, result.onboarding);
  }

  if (loading) {
    return (
      <SessionStatusPage
        title="Loading your profile…"
        body="Checking what you still need to set up."
        busy
      />
    );
  }

  if (unavailable || !onboarding || !configuration) {
    return (
      <SessionStatusPage
        title="We could not load your profile setup"
        body={unavailable ?? "Refresh the page and try again."}
      />
    );
  }

  if (!holdPhotos) {
    const destination = memberDestination(onboarding);
    if (destination !== "/onboarding") {
      return <Navigate to={destination} replace />;
    }
  }

  const step = holdPhotos ? "photos" : onboarding.next_step;

  if (step === "profile") {
    const screenIndex = PROFILE_SCREEN_ORDER.indexOf(profileScreen);
    const copy = PROFILE_SCREEN_COPY[profileScreen];
    const onBack =
      screenIndex > 0
        ? () => {
            setProfileScreen(PROFILE_SCREEN_ORDER[screenIndex - 1]);
            setError(undefined);
          }
        : undefined;

    if (profileScreen === "location" && profileId) {
      return (
        <OnboardingShell title={copy.title} intro={copy.intro} percent={percent} backDisabled={pending} onBack={onBack}>
          <LocationStep onSuccess={() => void reconcileProfile()} />
        </OnboardingShell>
      );
    }

    return (
      <OnboardingShell
        title={copy.title}
        intro={copy.intro}
        percent={percent}
        backDisabled={pending}
        onBack={onBack}
      >
        <SchemaFieldsForm
          fields={profileFieldsByScreen[profileScreen]}
          values={profileValues[profileScreen]}
          onChange={(key, value) =>
            setProfileValues((current) => ({
              ...current,
              [profileScreen]: { ...current[profileScreen], [key]: value },
            }))
          }
          onSubmit={() => saveProfile(profileScreen)}
          pending={pending}
          error={error}
          details={details}
          submitLabel="Continue"
          fieldHints={profileScreen === "identity" ? { last_name: "Your last name stays private." } : undefined}
        />
      </OnboardingShell>
    );
  }

  if (step === "preferences") {
    return (
      <OnboardingShell
        title="Who would you like to meet?"
        intro="Choose all that apply. You can change this anytime."
        percent={percent}
      >
        <PreferencesForm
          interestedField={interestedField}
          interestedIn={interestedIn}
          onInterestedIn={setInterestedIn}
          onSubmit={savePreferences}
          pending={pending}
          error={error}
          details={details}
        />
      </OnboardingShell>
    );
  }

  if (step === "photos") {
    return (
      <OnboardingShell
        title="Add your best photos"
        intro="Add at least one clear photo to continue."
        percent={percent}
        wide
      >
        <PhotosStep
          collection={configuration.collections.find((item) => item.key === "photos")}
          onboarding={onboarding}
          onReconcile={reconcileProfile}
          onContinue={() => {
            setHoldPhotos(false);
            setError(undefined);
          }}
          pending={pending}
          error={error}
        />
      </OnboardingShell>
    );
  }

  if (step === "location" && profileId) {
    const copy = PROFILE_SCREEN_COPY.location;
    return (
      <OnboardingShell title={copy.title} intro={copy.intro} percent={percent}>
        <LocationStep onSuccess={() => void reconcileProfile()} />
      </OnboardingShell>
    );
  }

  if (step === "options") {
    const optionsIndex = OPTIONS_SCREEN_ORDER.indexOf(optionsScreen);
    const copy = OPTIONS_SCREEN_COPY[optionsScreen];
    return (
      <OnboardingShell
        title={copy.title}
        intro={copy.intro}
        percent={percent}
        backDisabled={pending}
        onBack={
          optionsIndex > 0
            ? () => {
                setOptionsScreen(OPTIONS_SCREEN_ORDER[optionsIndex - 1]);
                setError(undefined);
              }
            : undefined
        }
      >
        <OptionsForm
          groups={optionGroupsByScreen[optionsScreen]}
          selections={optionSelections}
          onToggle={toggleOption}
          onSubmit={continueOptions}
          pending={pending}
          error={error}
        />
      </OnboardingShell>
    );
  }

  if (step === "publication") {
    // Insert a dating-location screen before publish when GET /profile or
    // GET /profile/location still reports configured: false.
    if (!locationConfirmed && profileId) {
      return (
        <OnboardingShell
          title="Where are you dating from?"
          intro="We use your general area to show people nearby. Your exact location is never shown."
          percent={percent}
        >
          <LocationStep onSuccess={() => void reconcileProfile()} />
        </OnboardingShell>
      );
    }
    return (
      <OnboardingShell
        title="Ready when you are"
        intro="Publish when you want other members to find you."
        percent={percent}
      >
        <PublishStep onSubmit={publish} pending={pending} error={error} />
      </OnboardingShell>
    );
  }

  return (
    <SessionStatusPage
      title="Onboarding is paused"
      body="We don't recognise this step. Sign out and try again later."
    />
  );
}
