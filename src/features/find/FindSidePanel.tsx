import type { ComponentType } from "react";
import type { DatezaCompatibilityReason, FindProfile, ProfileDetail, PromptAnswer } from "../../lib/api/findTypes.ts";
import { describeCompatibilityReasons } from "../discovery/compatibilityCopy.ts";
import {
  BriefcaseIcon,
  ChatIcon,
  ClockIcon,
  GraduationIcon,
  HeartCircleIcon,
  HeartIcon,
  SmokeOffIcon,
  SparkleIcon,
  UsersIcon,
  WineIcon,
  type IconProps,
} from "../shell/icons.tsx";
import { promptHeading } from "./findCardCopy.ts";
import type { OptionLabelLookup } from "./optionLabels.ts";
import { findAboutItems } from "./profileFacts.ts";

type Props = {
  profile: FindProfile;
  detail?: ProfileDetail;
  optionLabel: OptionLabelLookup;
  fieldLabel: OptionLabelLookup;
  onOpenDetail: () => void;
};

const MAX_INTERESTS_SHOWN = 5;

const REASON_ICONS: Record<string, ComponentType<IconProps>> = {
  shared_long_term_intent: HeartIcon,
  compatible_relationship_goals: HeartCircleIcon,
  relationship_goal_mismatch: HeartIcon,
  compatible_family_plans: UsersIcon,
  family_plan_mismatch: UsersIcon,
  shared_no_smoking: SmokeOffIcon,
  smoking_lifestyle_mismatch: SmokeOffIcon,
  compatible_drinking_style: WineIcon,
  similar_faith_importance: SparkleIcon,
  similar_social_style: UsersIcon,
  compatible_meeting_pace: ClockIcon,
  shared_interests: SparkleIcon,
  shared_languages: ChatIcon,
  compatible_communication_style: ChatIcon,
  compatible_planning_style: ClockIcon,
  similar_travel_style: SparkleIcon,
  compatible_diet: HeartIcon,
};

const FACT_ICONS: Record<string, ComponentType<IconProps>> = {
  work: BriefcaseIcon,
  education: GraduationIcon,
  smoking: SmokeOffIcon,
  drinking: WineIcon,
  looking_for: ClockIcon,
};

function interestLabels(profile: FindProfile, detail: ProfileDetail | undefined, optionLabel: OptionLabelLookup): string[] {
  if (detail && detail.interests.length > 0) {
    return detail.interests.map((interest) => interest.label);
  }
  return (profile.options.interests ?? [])
    .map((code) => optionLabel("interests", code))
    .filter((label): label is string => Boolean(label));
}

function featuredPrompt(detail: ProfileDetail | undefined): PromptAnswer | undefined {
  if (!detail || detail.prompts.length === 0) return undefined;
  return [...detail.prompts].sort((left, right) => left.position - right.position)[0];
}

function ReasonIcon({ reason }: { reason: DatezaCompatibilityReason }) {
  const Icon = REASON_ICONS[reason] ?? HeartIcon;
  return <Icon className="find-side__icon" />;
}

export function FindSidePanel({ profile, detail, optionLabel, fieldLabel, onOpenDetail }: Props) {
  const name = profile.display_name ?? "this person";
  const reasons = profile.compatibility
    ? profile.compatibility.reasons.filter((reason) => describeCompatibilityReasons([reason], profile.compatibility?.version).length > 0)
    : [];
  const reasonCopy = profile.compatibility
    ? describeCompatibilityReasons(profile.compatibility.reasons, profile.compatibility.version)
    : [];
  const facts = findAboutItems(profile, fieldLabel, optionLabel);
  const interests = interestLabels(profile, detail, optionLabel);
  const shownInterests = interests.slice(0, MAX_INTERESTS_SHOWN);
  const prompt = featuredPrompt(detail);
  const heading = promptHeading(profile.pronouns);

  if (reasonCopy.length === 0 && facts.length === 0 && shownInterests.length === 0 && !prompt) {
    return (
      <aside className="find-side find-side--minimal" aria-label={`More about ${name}`}>
        <button type="button" className="find-side__full" onClick={onOpenDetail}>
          View full profile →
        </button>
      </aside>
    );
  }

  return (
    <aside className="find-side" aria-label={`More about ${name}`}>
      {reasonCopy.length > 0 ? (
        <section className="find-side__section">
          <h2 className="find-side__title">Why you're compatible</h2>
          <ul className="find-side__reasons">
            {reasons.map((reason) => {
              const copy = describeCompatibilityReasons([reason], profile.compatibility?.version)[0];
              if (!copy) return null;
              return (
                <li key={reason}>
                  <ReasonIcon reason={reason} />
                  <span>{copy}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {facts.length > 0 ? (
        <section className="find-side__section">
          <h2 className="find-side__title">About {name}</h2>
          <ul className="find-side__about">
            {facts.map((fact) => {
              const Icon = FACT_ICONS[fact.key] ?? HeartIcon;
              return (
                <li key={fact.key}>
                  <Icon className="find-side__icon find-side__icon--muted" />
                  <span>{fact.value}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {shownInterests.length > 0 ? (
        <section className="find-side__section">
          <div className="find-side__title-row">
            <h2 className="find-side__title">Interests</h2>
            <button type="button" className="find-side__more" onClick={onOpenDetail}>
              View all
            </button>
          </div>
          <div className="find-side__chips">
            {shownInterests.map((label) => (
              <span className="find-side__chip" key={label}>
                {label}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {prompt ? (
        <section className="find-side__section">
          <h2 className="find-side__title">{heading}</h2>
          <p className="find-side__prompt">{prompt.answer}</p>
        </section>
      ) : null}

      <button type="button" className="find-side__full" onClick={onOpenDetail}>
        View full profile →
      </button>
    </aside>
  );
}
