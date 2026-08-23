type Props = {
  onSignOut: () => void;
  signingOut: boolean;
};

export function FeedHeader({ onSignOut, signingOut }: Props) {
  return (
    <header className="discover-topbar">
      <span className="auth-screen__brand" aria-label="DateZA">
        <svg width="24" height="24" viewBox="0 0 30 30" aria-hidden="true">
          <path
            d="M15 26S4 19.3 4 11.9C4 7.5 7.4 4.6 11 4.6c1.7 0 3.2.7 4 1.8.8-1.1 2.3-1.8 4-1.8 3.6 0 7 2.9 7 7.3C26 19.3 15 26 15 26z"
            fill="#E8375A"
          />
        </svg>
        <span>
          Date<span>ZA</span>
        </span>
      </span>
      <button className="discover-signout" type="button" onClick={onSignOut} disabled={signingOut}>
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </header>
  );
}
