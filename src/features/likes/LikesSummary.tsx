type Props = {
  incomingCount?: number;
  outgoingCount?: number;
  mutualCount: number;
};

export function LikesSummary({ incomingCount, outgoingCount, mutualCount }: Props) {
  return (
    <section className="likes-rail-card" aria-label="Your likes">
      <h2 className="likes-rail-card__title">Your likes</h2>
      <dl className="likes-summary">
        {incomingCount != null ? (
          <div>
            <dt>Liked you</dt>
            <dd>{incomingCount}</dd>
          </div>
        ) : null}
        {outgoingCount != null ? (
          <div>
            <dt>You liked</dt>
            <dd>{outgoingCount}</dd>
          </div>
        ) : null}
        <div>
          <dt>Mutual likes</dt>
          <dd>{mutualCount}</dd>
        </div>
      </dl>
      <p className="likes-rail-card__hint">Counts are for people DateZA can list on this page.</p>
    </section>
  );
}
