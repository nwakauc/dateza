import { PaperPlaneIcon } from "./icons.tsx";

type Props = {
  className: string;
  iconClassName: string;
};

/**
 * Visibly present but always disabled. The real D8N backend has no endpoint
 * to message a member before a mutual match — conversations only exist via
 * `POST /matches/{id}/conversation` once a match already does (see
 * MatchModal.tsx and the handoff report). Rendering this as a working
 * button would mean the frontend fabricating a state the server doesn't
 * track, which is exactly what it must not do — so it stays disabled with
 * an honest explanation instead.
 */
export function SendOpenerButton({ className, iconClassName }: Props) {
  return (
    <button
      type="button"
      className={`opener-button ${className}`}
      disabled
      aria-label="Send opener — coming soon"
      title="Sending a message before you match isn't available yet."
    >
      <PaperPlaneIcon className={iconClassName} />
    </button>
  );
}
