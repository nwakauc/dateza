import { useEffect } from "react";
import { Link } from "react-router-dom";
import { GearIcon } from "../shell/icons.tsx";

export default function SettingsPage() {
  useEffect(() => {
    document.title = "Settings — DateZA";
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
        <p className="shell-page__eyebrow">Account</p>
        <h1 className="shell-page__title">Settings</h1>
        <p className="shell-page__subtitle">Notifications, privacy, and account controls.</p>
      </div>

      <div className="shell-empty">
        <GearIcon className="shell-empty__icon" />
        <p className="shell-empty__title">Settings are coming soon</p>
        <p className="shell-empty__body">
          Notification preferences, privacy controls, and account management will live here. For now, manage your
          profile from the Profile tab.
        </p>
      </div>
    </div>
  );
}
