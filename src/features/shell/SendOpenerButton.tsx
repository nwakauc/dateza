import { PaperPlaneIcon } from "./icons.tsx";

type Props = {
  className: string;
  iconClassName: string;
  disabled?: boolean;
  onClick?: () => void;
};

export function SendOpenerButton({ className, iconClassName, disabled = false, onClick }: Props) {
  return (
    <button
      type="button"
      className={`opener-button ${className}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={disabled ? "Send opener unavailable" : "Send opener"}
    >
      <PaperPlaneIcon className={iconClassName} />
    </button>
  );
}
