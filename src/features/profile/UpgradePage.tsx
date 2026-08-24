import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SparkleIcon } from "../shell/icons.tsx";

const BENEFITS = [
  "See who's already liked you",
  "More Discover and Find profiles each day",
  "Priority placement in Discover",
];

export default function UpgradePage() {
  useEffect(() => {
    document.title = "Upgrade — DateZA";
    return () => {
      document.title = "DateZA — Meet someone who chooses you.";
    };
  }, []);

  return (
    <div className="shell-page shell-page--narrow" id="main-content">
      <Link className="onboard-back-top" to="/profile">
        ← Back to profile
      </Link>
      <div className="shell-page__header">
        <p className="shell-page__eyebrow">DateZA Plus</p>
        <h1 className="shell-page__title">Upgrade your DateZA</h1>
        <p className="shell-page__subtitle">Premium is on its way. Here's what it will bring.</p>
      </div>

      <div className="profile-section">
        {BENEFITS.map((benefit) => (
          <div key={benefit} className="shell-row shell-row--static">
            <span className="shell-row__icon">
              <SparkleIcon />
            </span>
            <span className="shell-row__body">
              <p className="shell-row__title">{benefit}</p>
            </span>
          </div>
        ))}
      </div>

      <div className="shell-empty">
        <p className="shell-empty__title">Not available yet</p>
        <p className="shell-empty__body">
          DateZA Plus is still in the works. We'll let you know the moment it's ready.
        </p>
      </div>
    </div>
  );
}
