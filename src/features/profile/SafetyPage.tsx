import { useEffect } from "react";
import { Link } from "react-router-dom";

const TIPS = [
  {
    title: "Chat before you meet",
    body: "Get to know someone on DateZA before sharing contact details or making plans.",
  },
  {
    title: "Meet in public, tell a friend",
    body: "Choose a public place for a first meeting, and let someone you trust know where you'll be.",
  },
  {
    title: "Trust your instincts",
    body: "If something feels off, end the conversation or the date. You don't owe anyone an explanation.",
  },
];

export default function SafetyPage() {
  useEffect(() => {
    document.title = "Safety — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  return (
    <div className="shell-page shell-page--narrow">
      <Link className="onboard-back-top" to="/profile">
        ← Back to profile
      </Link>
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">Your safety</p>
        <h1 className="shell-page__title">Safety &amp; support</h1>
        <p className="shell-page__subtitle">A few guidelines for meeting people from DateZA.</p>
      </div>

      <div className="profile-section">
        {TIPS.map((tip) => (
          <div key={tip.title} className="shell-row shell-row--static">
            <span className="shell-row__body">
              <p className="shell-row__title">{tip.title}</p>
              <p className="shell-row__hint">{tip.body}</p>
            </span>
          </div>
        ))}
      </div>

      <div className="profile-section">
        <p className="profile-section__title">Report &amp; block</p>
        <p className="profile-section__text">
          In-app reporting and blocking are available from another member&apos;s
          profile. Open the ••• menu, then choose Report or Block. Blocking is
          free and stops future interaction between you.
        </p>
      </div>
    </div>
  );
}
