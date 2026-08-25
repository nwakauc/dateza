import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { FindProfile } from "../../lib/api/findTypes.ts";
import { FindSwipeCard } from "./FindSwipeCard.tsx";
import type { OptionLabelLookup } from "./optionLabels.ts";

type InteractionState = "idle" | "liked" | "matched" | "passed";
type PendingAction = "liked" | "passed";
type ExitDirection = "left" | "right";

type Props = {
  profile: FindProfile;
  peekProfiles: readonly FindProfile[];
  interaction: InteractionState;
  optionLabel: OptionLabelLookup;
  committingAction?: PendingAction;
  exiting?: ExitDirection;
  onOpenDetail: () => void;
  onLike: () => void;
  onPass: () => void;
  onUndo?: () => void;
  dragEnabled: boolean;
  /** True once at least one card has already been shown this session — an
   * unsolicited focus jump on Find's very first load would be surprising,
   * but moving focus to each new card as it becomes active keeps keyboard
   * users oriented after a transition. This component remounts (via a
   * `key={profile.id}` from the caller) each time the active profile
   * changes, so a plain mount effect is the right place for this. */
  autoFocus: boolean;
};

const DRAG_COMMIT_THRESHOLD_PX = 96;
const DRAG_STAMP_FULL_OPACITY_PX = 110;

export function FindSwipeStack({
  profile,
  peekProfiles,
  interaction,
  optionLabel,
  committingAction,
  exiting,
  onOpenDetail,
  onLike,
  onPass,
  onUndo,
  dragEnabled,
  autoFocus,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);

  useEffect(() => {
    if (autoFocus) {
      wrapRef.current?.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount (this component remounts per profile via the caller's `key`)
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragEnabled) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // Buttons (photo nav, info, Pass/Like) handle their own interaction —
    // only the card body itself should start a swipe gesture.
    if ((event.target as HTMLElement).closest("button")) return;
    dragStartX.current = event.clientX;
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || dragStartX.current === null) return;
    setDragX(event.clientX - dragStartX.current);
  }

  function handlePointerUp() {
    if (!dragging) return;
    setDragging(false);
    dragStartX.current = null;
    if (dragX >= DRAG_COMMIT_THRESHOLD_PX) {
      onLike();
    } else if (dragX <= -DRAG_COMMIT_THRESHOLD_PX) {
      onPass();
    } else {
      setDragX(0);
    }
  }

  const phaseClass =
    exiting === "left"
      ? " find-stack__active--exit-left"
      : exiting === "right"
        ? " find-stack__active--exit-right"
        : committingAction === "passed"
          ? " find-stack__active--parked-left"
          : committingAction === "liked"
            ? " find-stack__active--parked-right"
            : "";

  const showLiveDrag = dragging || (dragX !== 0 && !committingAction && !exiting);
  const style = showLiveDrag ? { transform: `translateX(${dragX}px) rotate(${dragX / 22}deg)`, transition: "none" } : undefined;
  const stampOpacity = Math.min(Math.abs(dragX) / DRAG_STAMP_FULL_OPACITY_PX, 1);

  return (
    <div className="find-stack">
      {peekProfiles.slice(0, 2).map((peek, index) => (
        <div
          key={peek.id}
          className="find-stack__peek"
          style={{ zIndex: 1 - index, transform: `scale(${0.94 - index * 0.05}) translateY(${10 + index * 8}px)` }}
          aria-hidden="true"
        >
          {peek.photos[0] ? <img src={peek.photos[0].url} alt="" /> : null}
        </div>
      ))}
      <div
        ref={wrapRef}
        className={`find-stack__active${phaseClass}${dragging ? " find-stack__active--dragging" : ""}`}
        style={style}
        tabIndex={-1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {showLiveDrag && stampOpacity > 0.05 ? (
          <span
            className={dragX > 0 ? "find-stack__stamp find-stack__stamp--like" : "find-stack__stamp find-stack__stamp--pass"}
            style={{ opacity: stampOpacity }}
            aria-hidden="true"
          >
            {dragX > 0 ? "LIKE" : "PASS"}
          </span>
        ) : null}
        <FindSwipeCard profile={profile} interaction={interaction} optionLabel={optionLabel} onOpenDetail={onOpenDetail} />
      </div>
      {committingAction && onUndo ? (
        <div className="find-undo" role="status" aria-live="polite">
          <span>{committingAction === "passed" ? "Passed" : "Liked"}</span>
          <button
            type="button"
            className="find-undo__button"
            onClick={onUndo}
            aria-label={`Undo ${committingAction === "passed" ? "pass" : "like"} on ${profile.display_name ?? "this profile"}`}
          >
            Undo
          </button>
        </div>
      ) : null}
    </div>
  );
}
