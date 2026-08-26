import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import type { DatezaCompatibility, ProfileDetail } from "../../lib/api/findTypes.ts";
import type { ProfileConfiguration } from "../../lib/api/profileTypes.ts";
import { describeCompatibilityReasons } from "../discovery/compatibilityCopy.ts";
import { buildOptionLabelLookup, buildProfileFieldLabelLookup } from "../find/optionLabels.ts";
import { CloseIcon, HeartIcon, MapPinIcon, PencilIcon } from "../shell/icons.tsx";
import { SendOpenerButton } from "../shell/SendOpenerButton.tsx";
import { ProfileGallery } from "./ProfileGallery.tsx";
import {
  aboutFacts,
  identityLocation,
  intentFacts,
  interestLabels,
  lifestyleFacts,
  matchHeadline,
  moreFacts,
  personalityFacts,
  summaryPills,
  workFacts,
  type ProfileFact,
} from "./richProfileContent.ts";

type Props = {
  profile: ProfileDetail;
  compatibility: DatezaCompatibility;
  configuration?: ProfileConfiguration;
  photoIndex: number;
  onPhotoIndex: (index: number) => void;
  mode: "member" | "owner";
  busy?: boolean;
  interaction?: "idle" | "liked" | "passed";
  onLike?: () => void;
  onPass?: () => void;
  safety?: ReactNode;
  onPhotosExpired?: () => void;
};

function FactGrid({ facts, title }: { facts: ProfileFact[]; title: string }) {
  if (facts.length === 0) return null;
  return (
    <section className="rich-profile__section">
      <h2 className="rich-profile__section-title">{title}</h2>
      <dl className="rich-profile__facts">
        {facts.map((fact) => (
          <div className="rich-profile__fact" key={fact.key}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function CompatibilityCard({ compatibility }: { compatibility: NonNullable<DatezaCompatibility> }) {
  const reasons = describeCompatibilityReasons(compatibility.reasons, compatibility.version);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, compatibility.score)) / 100);

  return (
    <section className="rich-compat" aria-label="Compatibility">
      <h2 className="rich-profile__section-title">Our compatibility</h2>
      <div className="rich-compat__score">
        <svg className="rich-compat__ring" viewBox="0 0 96 96" aria-hidden="true">
          <circle className="rich-compat__track" cx="48" cy="48" r={radius} />
          <circle
            className="rich-compat__progress"
            cx="48"
            cy="48"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="rich-compat__label">
          <strong>{compatibility.score}%</strong>
          <span>{matchHeadline(compatibility.score)}</span>
        </div>
      </div>
      {reasons.length > 0 ? (
        <>
          <h3 className="rich-compat__why">Why you match</h3>
          <ul className="rich-compat__reasons">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

export function RichProfileView({
  profile,
  compatibility,
  configuration,
  photoIndex,
  onPhotoIndex,
  mode,
  busy = false,
  interaction = "idle",
  onLike,
  onPass,
  safety,
  onPhotosExpired,
}: Props) {
  const name = profile.display_name ?? "DateZA member";
  const location = identityLocation(profile);
  const optionLabel = buildOptionLabelLookup(configuration);
  const fieldLabel = buildProfileFieldLabelLookup(configuration);
  const about = aboutFacts(profile, fieldLabel, optionLabel);
  const work = workFacts(profile);
  const lifestyle = lifestyleFacts(profile, fieldLabel, optionLabel);
  const intent = intentFacts(profile, optionLabel);
  const personality = personalityFacts(profile, optionLabel);
  const more = moreFacts(profile, optionLabel);
  const interests = interestLabels(profile);
  const pills = summaryPills(profile, optionLabel, compatibility?.score);
  const locked = busy || interaction !== "idle";

  const actions =
    mode === "owner" ? (
      <div className="rich-profile__actions">
        <Link className="rich-profile__edit" to="/profile/edit">
          <PencilIcon className="rich-profile__icon" />
          Edit profile
        </Link>
      </div>
    ) : (
      <div className="rich-profile__actions">
        <button
          className="rich-profile__icon-button rich-profile__icon-button--pass"
          type="button"
          onClick={onPass}
          disabled={locked}
          aria-label={interaction === "passed" ? "Passed" : "Pass"}
        >
          <CloseIcon className="rich-profile__icon" />
        </button>
        <button
          className="rich-profile__icon-button rich-profile__icon-button--like"
          type="button"
          onClick={onLike}
          disabled={locked}
          aria-label={interaction === "liked" ? "Liked" : "Like"}
        >
          <HeartIcon className="rich-profile__icon" />
        </button>
        <SendOpenerButton className="rich-profile__icon-button" iconClassName="rich-profile__icon" />
      </div>
    );

  return (
    <article className="rich-profile">
      <div className="rich-profile__top">
        <div className="rich-profile__visual">
          <ProfileGallery
            photos={profile.photos}
            name={name}
            photoIndex={photoIndex}
            onPhotoIndex={onPhotoIndex}
            verified={profile.verified}
            onPhotosExpired={onPhotosExpired}
            overlay={safety}
          />
          <header className="rich-profile__identity">
            <h1 className="rich-profile__name">
              {name}
              {profile.age ? <span className="rich-profile__age">, {profile.age}</span> : null}
            </h1>
            {location ? (
              <p className="rich-profile__location">
                <MapPinIcon className="rich-profile__pin" />
                {location}
              </p>
            ) : null}
            {pills.length > 0 ? (
              <div className="rich-profile__pills">
                {pills.map((pill, index) => (
                  <span className={index === 0 && compatibility ? "rich-profile__pill rich-profile__pill--score" : "rich-profile__pill"} key={pill}>
                    {pill}
                  </span>
                ))}
              </div>
            ) : null}
            {profile.bio ? <p className="rich-profile__lede">{profile.bio}</p> : null}
            {actions}
          </header>
        </div>

        <aside className="rich-profile__rail">
          {compatibility ? <CompatibilityCard compatibility={compatibility} /> : null}
          <FactGrid facts={about} title={`About ${name.split(" ")[0] ?? name}`} />
          <FactGrid facts={work} title="Work & education" />
          {profile.prompts.length > 0 ? (
            <section className="rich-profile__section">
              <h2 className="rich-profile__section-title">Prompts</h2>
              <div className="rich-profile__prompts">
                {[...profile.prompts]
                  .sort((left, right) => left.position - right.position)
                  .map((prompt) => (
                  <blockquote className="rich-prompt" key={prompt.key}>
                    <p className="rich-prompt__q">{prompt.prompt}</p>
                    <p className="rich-prompt__a">{prompt.answer}</p>
                  </blockquote>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <div className="rich-profile__story">
        {lifestyle.length > 0 ? (
          <section className="rich-profile__section">
            <h2 className="rich-profile__section-title">My lifestyle</h2>
            <ul className="rich-profile__lifestyle">
              {lifestyle.map((fact) => (
                <li key={fact.key}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {profile.looking_for_text || intent.length > 0 ? (
          <section className="rich-profile__section">
            <h2 className="rich-profile__section-title">What I&apos;m looking for</h2>
            {profile.looking_for_text ? <p className="rich-profile__copy">{profile.looking_for_text}</p> : null}
            {intent.length > 0 ? (
              <>
                {profile.looking_for_text ? <h3 className="rich-profile__intent-label">Intent</h3> : null}
                <div className="rich-profile__pills">
                  {intent.flatMap((fact) =>
                    fact.value.split(" · ").map((value) => (
                      <span className="rich-profile__pill" key={`${fact.key}-${value}`}>
                        {value}
                      </span>
                    )),
                  )}
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        {interests.length > 0 ? (
          <section className="rich-profile__section">
            <h2 className="rich-profile__section-title">Interests</h2>
            <div className="rich-profile__pills rich-profile__pills--interests">
              {interests.map((label) => (
                <span className="rich-profile__pill rich-profile__pill--interest" key={label}>
                  {label}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <FactGrid facts={personality} title="How I connect" />
        <FactGrid facts={more} title="A little more about me" />
      </div>
    </article>
  );
}

export function RichProfileSkeleton() {
  return (
    <div className="rich-profile rich-profile--loading" aria-busy="true" aria-label="Loading profile">
      <div className="rich-profile__top">
        <div className="rich-profile__visual">
          <div className="rich-gallery">
            <div className="rich-gallery__stage rich-gallery__stage--skeleton" />
          </div>
          <div className="rich-skeleton-line rich-skeleton-line--title" />
          <div className="rich-skeleton-line" />
          <div className="rich-skeleton-line rich-skeleton-line--wide" />
        </div>
        <aside className="rich-profile__rail">
          <div className="rich-compat rich-compat--skeleton" />
          <div className="rich-skeleton-line" />
          <div className="rich-skeleton-line" />
        </aside>
      </div>
    </div>
  );
}
