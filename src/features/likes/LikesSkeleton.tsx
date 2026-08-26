export function LikesSkeleton() {
  return (
    <div className="likes-stage likes-stage--loading" aria-busy="true" aria-live="polite">
      <div className="likes-rail likes-rail--left" aria-hidden="true">
        <span className="likes-skel likes-skel--card" />
        <span className="likes-skel likes-skel--nav" />
      </div>
      <div className="likes-main">
        <span className="likes-skel likes-skel--title" />
        <span className="likes-skel likes-skel--tabs" />
        <div className="likes-grid">
          <span className="likes-skel likes-skel--photo" />
          <span className="likes-skel likes-skel--photo" />
          <span className="likes-skel likes-skel--photo" />
          <span className="likes-skel likes-skel--photo" />
        </div>
      </div>
      <div className="likes-rail likes-rail--right" aria-hidden="true">
        <span className="likes-skel likes-skel--card" />
        <span className="likes-skel likes-skel--card" />
      </div>
      <span className="sr-only">Loading your likes…</span>
    </div>
  );
}
