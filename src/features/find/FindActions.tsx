import { CloseIcon, HeartIcon, PaperPlaneIcon } from "../shell/icons.tsx";

type Props = {
  disabled: boolean;
  passLabel: string;
  likeLabel: string;
  openerLabel: string;
  openerSoon?: boolean;
  openerDisabled?: boolean;
  onPass: () => void;
  onLike: () => void;
  onOpener: () => void;
};

export function FindActions({
  disabled,
  passLabel,
  likeLabel,
  openerLabel,
  openerSoon = false,
  openerDisabled = false,
  onPass,
  onLike,
  onOpener,
}: Props) {
  return (
    <div className="find-actions">
      <div className="find-actions__slot">
        <button
          type="button"
          className="find-actions__button find-actions__button--pass"
          onClick={onPass}
          disabled={disabled}
          aria-label={passLabel}
        >
          <CloseIcon className="find-actions__icon" />
        </button>
        <span className="find-actions__caption" aria-hidden="true">
          Pass
        </span>
      </div>
      <div className="find-actions__slot">
        <button
          type="button"
          className="find-actions__button find-actions__button--like"
          onClick={onLike}
          disabled={disabled}
          aria-label={likeLabel}
        >
          <HeartIcon className="find-actions__icon" />
        </button>
        <span className="find-actions__caption" aria-hidden="true">
          Like
        </span>
      </div>
      <div className="find-actions__slot">
        <button
          type="button"
          className="find-actions__button find-actions__button--opener"
          onClick={onOpener}
          disabled={disabled || openerDisabled}
          aria-label={openerLabel}
        >
          <PaperPlaneIcon className="find-actions__icon" />
          {openerSoon ? <span className="find-actions__soon">New</span> : null}
        </button>
        <span className="find-actions__caption" aria-hidden="true">
          Send opener
        </span>
      </div>
    </div>
  );
}
