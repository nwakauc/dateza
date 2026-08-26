import { Link } from "react-router-dom";
import type { ReactNode } from "react";

type Action = { to: string; label: string; subtle?: boolean };

type Props = {
  icon: ReactNode;
  title: string;
  body: string;
  actions?: Action[];
};

export function LikesEmptyState({ icon, title, body, actions }: Props) {
  return (
    <div className="shell-empty likes-empty">
      {icon}
      <p className="shell-empty__title">{title}</p>
      <p className="shell-empty__body">{body}</p>
      {actions && actions.length > 0 ? (
        <div className="likes-empty__actions">
          {actions.map((action) => (
            <Link
              key={action.to}
              className={action.subtle ? "shell-text-action" : "shell-primary-action"}
              to={action.to}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
