import { Link } from "react-router-dom";
import { useBrandAdminAccess } from "../hq/useBrandAdminAccess.ts";

type Props = {
  variant: "chip" | "menu" | "row";
  onNavigate?: () => void;
};

/** DateZA Admin console entry — visible only when operator bootstrap succeeds. */
export function OpsEntryLink({ variant, onNavigate }: Props) {
  const access = useBrandAdminAccess();
  if (access !== "allowed") {
    return null;
  }

  if (variant === "chip") {
    return (
      <Link to="/ops" className="shell-ops-chip" aria-label="Open DateZA Admin">
        Admin
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link to="/ops" className="shell-row" onClick={onNavigate}>
        <span className="shell-row__body">
          <p className="shell-row__title">Admin</p>
          <p className="shell-row__hint">Operations console</p>
        </span>
      </Link>
    );
  }

  return (
    <Link to="/ops" onClick={onNavigate}>
      Admin
    </Link>
  );
}
