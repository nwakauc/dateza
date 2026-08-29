import { Link } from "react-router-dom";
import { BriefcaseIcon } from "../shell/icons.tsx";
import { useBrandAdminAccess } from "./useBrandAdminAccess.ts";

type Props = {
  /** `chip` = top-nav shortcut; `menu` = account/mobile menu row. */
  variant: "chip" | "menu";
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

  return (
    <Link to="/hq" onClick={onNavigate}>
      <BriefcaseIcon />
      <span>D8N HQ</span>
    </Link>
  );
}
