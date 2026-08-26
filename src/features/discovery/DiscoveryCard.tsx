import type { DiscoveryProfile } from "../../lib/api/discoveryTypes.ts";
import { CloseIcon, HeartIcon, ShieldCheckIcon } from "../shell/icons.tsx";
import { SendOpenerButton } from "../shell/SendOpenerButton.tsx";
import { VERIFIED_CONTACT_LABEL } from "../shell/trustLabels.ts";
import type { OptionLabelLookup } from "../find/optionLabels.ts";
import { describeCompatibilityReasons } from "./compatibilityCopy.ts";

type InteractionState = "idle" | "liked" | "matched" | "passed";

const noOptionLabel: OptionLabelLookup = () => undefined;

type Props = {
  profile: DiscoveryProfile;
  interaction: InteractionState;
  onOpen: () => void;
  onLike: () => void;
  onPass: () => void;
  pending: boolean;
  /** Optional so existing callers/tests that don't need chips keep working. */
  optionLabel?: OptionLabelLookup;
};

// At most two reasons on the card itself — enough to be persuasive without
// turning into a list. The full set is available on the profile detail page.
const MAX_REASONS_SHOWN = 2;
const MAX_TRAITS_SHOWN = 2;

export function DiscoveryCard({ profile, interaction, onOpen, onLike, onPass, pending, optionLabel = noOptionLabel }: Props) {
  const photo = profile.photos[0];
  const location = [profile.city, profile.country_code].filter(Boolean).join(", ");
  const reasons = profile.compatibility
    ? describeCompatibilityReasons(profile.compatibility.reasons).slice(0, MAX_REASONS_SHOWN)
    : [];
  const relationshipCode = profile.options.relationship_intent?.[0];
  const traits = [
    relationshipCode ? optionLabel("relationship_intent", relationshipCode) : undefined,
    ...(profile.options.interests ?? []).map((code) => optionLabel("interests", code)),
  ]
    .filter((label): label is string => Boolean(label))
    .slice(0, MAX_TRAITS_SHOWN);

  return (
    <article className="discovery-card">
      <button
        className="discovery-card__photo"
        type="button"
        onClick={onOpen}
        aria-label={`Open ${profile.display_name ?? "this profile"}'s profile`}
      >
        {photo ? (
          <img src={photo.url} alt="" loading="lazy" />
        ) : (
          <div className="discover-card__photo-placeholder" aria-hidden="true" />
        )}
        {profile.compatibility ? (
          <span className="discovery-card__score">
            <span className="discovery-card__score-dot" />
            {profile.compatibility.score}% compatible
          </span>
        ) : null}
        <div className="discovery-card__scrim">
          <div className="discovery-card__name-row">
            <span className="discovery-card__display-name">{profile.display_name ?? "DateZA member"}</span>
            {profile.age ? <span className="discovery-card__age">{profile.age}</span> : null}
          </div>
          {location ? <p className="discovery-card__location">{location}</p> : null}
          {profile.verified || traits.length > 0 ? (
            <div className="discovery-card__badges">
              {profile.verified ? (
                <span className="discovery-card__verified">
                  <ShieldCheckIcon className="discovery-card__verified-icon" />
                  {VERIFIED_CONTACT_LABEL}
                </span>
              ) : null}
              {traits.map((trait) => (
                <span className="discovery-card__trait" key={trait}>
                  {trait}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </button>

      {reasons.length > 0 ? (
        <p className="discovery-card__reasons">
          <span className="discovery-card__reasons-dot" aria-hidden="true" />
          {reasons.join(" · ")}
        </p>
      ) : null}

      <div className="discovery-card__actions">
        {interaction === "matched" ? (
          <span className="discovery-card__match-note">It's a match!</span>
        ) : (
          <>
            <button
              className="discovery-card__icon-button discovery-card__icon-button--pass"
              type="button"
              onClick={onPass}
              disabled={pending || interaction === "passed" || interaction === "liked"}
              aria-label={interaction === "passed" ? "Passed" : "Pass"}
            >
              <CloseIcon className="discovery-card__icon" />
            </button>
            <button
              className="discovery-card__icon-button discovery-card__icon-button--like"
              type="button"
              onClick={onLike}
              disabled={pending || interaction === "liked" || interaction === "passed"}
              aria-label={interaction === "liked" ? "Liked" : "Like"}
            >
              <HeartIcon className="discovery-card__icon" />
            </button>
            <SendOpenerButton className="discovery-card__icon-button" iconClassName="discovery-card__icon" />
          </>
        )}
      </div>
    </article>
  );
}
