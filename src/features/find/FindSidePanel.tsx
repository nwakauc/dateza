import type { FindProfile } from "../../lib/api/findTypes.ts";
import { describeCompatibilityReasons } from "../discovery/compatibilityCopy.ts";
import type { OptionLabelLookup } from "./optionLabels.ts";
import { buildAboutFacts } from "./profileFacts.ts";

type Props = {
  profile: FindProfile;
  optionLabel: OptionLabelLookup;
  fieldLabel: OptionLabelLookup;
};

const MAX_INTERESTS_SHOWN = 8;

/**
 * Desktop-only companion to the swipe card: uses real fields the card
 * already has but doesn't have room for (full compatibility reasons,
 * work/education/lifestyle, the full interest list). Renders nothing it
 * can't back with real data — no invented sections.
 */
export function FindSidePanel({ profile, optionLabel, fieldLabel }: Props) {
  const name = profile.display_name ?? "this person";
  const reasons = profile.compatibility ? describeCompatibilityReasons(profile.compatibility.reasons) : [];
  const facts = buildAboutFacts(profile, fieldLabel);
  const interestLabels = (profile.options.interests ?? [])
    .map((code) => optionLabel("interests", code))
    .filter((label): label is string => Boolean(label))
    .slice(0, MAX_INTERESTS_SHOWN);

  if (reasons.length === 0 && facts.length === 0 && interestLabels.length === 0) {
    return null;
  }

  return (
    <aside className="find-side" aria-label={`More about ${name}`}>
      {reasons.length > 0 ? (
        <section className="find-side__section">
          <h2 className="find-side__title">Why you're compatible</h2>
          <ul className="find-side__reasons">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {facts.length > 0 ? (
        <section className="find-side__section">
          <h2 className="find-side__title">About {name}</h2>
          <dl className="find-side__facts">
            {facts.map((fact) => (
              <div className="find-side__fact" key={fact.key}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {interestLabels.length > 0 ? (
        <section className="find-side__section">
          <h2 className="find-side__title">Interests</h2>
          <div className="find-side__chips">
            {interestLabels.map((label) => (
              <span className="find-side__chip" key={label}>
                {label}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  );
}
