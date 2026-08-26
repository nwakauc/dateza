type Props = {
  mutualCount: number;
};

export function LikesSummary({ mutualCount }: Props) {
  return (
    <section className="likes-rail-card" aria-label="Your likes">
      <h2 className="likes-rail-card__title">Your likes</h2>
      <dl className="likes-summary">
        <div>
          <dt>Mutual likes</dt>
          <dd>{mutualCount}</dd>
        </div>
      </dl>
      <p className="likes-rail-card__hint">Counts are for matches DateZA can list. Incoming and sent likes aren’t available yet.</p>
    </section>
  );
}
