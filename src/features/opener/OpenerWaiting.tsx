import { HourglassIcon, SparkleIcon } from "../shell/icons.tsx";

type Props = {
  name: string;
  sentText?: string;
};

export function OpenerWaiting({ name, sentText }: Props) {
  return (
    <section className="find-rail-card find-waiting" aria-label="Waiting for reply">
      <div className="find-waiting__mark" aria-hidden="true">
        <SparkleIcon className="find-waiting__sparkle find-waiting__sparkle--a" />
        <HourglassIcon className="find-waiting__hourglass" />
        <SparkleIcon className="find-waiting__sparkle find-waiting__sparkle--b" />
      </div>
      <h2 className="find-rail-card__title">Opener sent</h2>
      {sentText ? <p className="opener-waiting__quote">“{sentText}”</p> : null}
      <p className="find-rail-card__body">Waiting for {name} to reply.</p>
    </section>
  );
}
