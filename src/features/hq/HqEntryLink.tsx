import { Link } from "react-router-dom";
import { BriefcaseIcon, ChevronRightIcon } from "../shell/icons.tsx";
import { useBrandAdminAccess } from "./useBrandAdminAccess.ts";

type Props = {
  /** `chip` = top-nav shortcut; `menu` = account/mobile menu row; `row` = profile account list. */
  variant: "chip" | "menu" | "row";
  onNavigate?: () => void;
};

/** Admin-only link into D8N HQ. Hidden until brand-admin access is confirmed. */
export function HqEntryLink({ variant, onNavigate }: Props) {
  const access = useBrandAdminAccess();
  if (access !== "allowed") {
    return null;
  }

  if (variant === "chip") {
    return (
      <Link to="/hq" className="shell-hq-chip" aria-label="Open D8N HQ">
        HQ
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link to="/hq" className="shell-row" onClick={onNavigate}>
        <span className="shell-row__icon">
          <BriefcaseIcon />
        </span>
        <span className="shell-row__body">
          <p className="shell-row__title">D8N HQ</p>
          <p className="shell-row__hint">Operator command centre</p>
        </span>
        <ChevronRightIcon className="shell-row__chevron" />
      </Link>
    );
  }

  return (
    <Link to="/hq" onClick={onNavigate}>
      <BriefcaseIcon />
      <span>D8N HQ</span>
    </Link>
  );
}
