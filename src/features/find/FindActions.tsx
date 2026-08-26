import { CloseIcon, HeartIcon } from "../shell/icons.tsx";
import { SendOpenerButton } from "../shell/SendOpenerButton.tsx";

type Props = {
  disabled: boolean;
  passLabel: string;
  likeLabel: string;
  onPass: () => void;
  onLike: () => void;
};

export function FindActions({ disabled, passLabel, likeLabel, onPass, onLike }: Props) {
  return (
    <div className="find-actions">
      <button
        type="button"
        className="find-actions__button find-actions__button--pass"
        onClick={onPass}
        disabled={disabled}
        aria-label={passLabel}
      >
        <CloseIcon className="find-actions__icon" />
      </button>
      <button
        type="button"
        className="find-actions__button find-actions__button--like"
        onClick={onLike}
        disabled={disabled}
        aria-label={likeLabel}
      >
        <HeartIcon className="find-actions__icon" />
      </button>
      <SendOpenerButton className="find-actions__button" iconClassName="find-actions__icon" />
    </div>
  );
}
