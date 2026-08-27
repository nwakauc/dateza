import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { unmatchMatch } from "../../lib/api/social.ts";
import { blockProfile, reportProfile, reportSubmission } from "../../lib/api/safety.ts";
import { PROFILE_REPORT_REASONS, type ProfileReportReason } from "../../lib/api/safetyTypes.ts";
import { ContentReportDialog } from "../safety/ContentReportDialog.tsx";
import { REPORT_REASON_LABELS } from "../safety/reportCopy.ts";
import { Modal } from "../verification/Modal.tsx";
import { MoreIcon } from "../shell/icons.tsx";
import { useToast } from "../toasts/useToast.ts";

type ContentReportKind = "conversation" | "profile_media" | "hook";

type Props = {
  profileId: string;
  name: string;
  onBlocked: () => void;
  /** Active Match public UUID. Unmatch is only offered for a current match. */
  matchId?: string;
  onUnmatched?: () => void;
  conversationId?: string;
  mediaId?: string;
  hookId?: string;
};

export function ProfileSafetyActions({
  profileId,
  name,
  matchId,
  onBlocked,
  onUnmatched,
  conversationId,
  mediaId,
  hookId,
}: Props) {
  const toast = useToast();
  const menuId = useId();
  const reasonFieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"report" | "block" | "unmatch" | undefined>();
  const [contentReport, setContentReport] = useState<ContentReportKind | undefined>();
  const [reason, setReason] = useState<ProfileReportReason | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [reported, setReported] = useState(false);
  const payload = reportSubmission(reason, note);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function closeDialog() {
    if (busy) return;
    setDialog(undefined);
    setError(undefined);
    setReported(false);
    setReason("");
    setNote("");
  }

  function toggleReason(code: ProfileReportReason) {
    setReason((current) => (current === code ? "" : code));
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault();
    if (!payload || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await reportProfile(profileId, payload);
      setReported(true);
    } catch {
      setError("We could not send that report. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmBlock() {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await blockProfile(profileId);
      toast.success(`${name} is blocked`);
      onBlocked();
    } catch (caught: unknown) {
      if (caught instanceof ApiError && (caught.status === 404 || caught.code === "profile_unavailable")) {
        toast.success(`${name} is blocked`);
        onBlocked();
        return;
      }
      setError("We could not block this person. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmUnmatch() {
    if (!matchId || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await unmatchMatch(matchId);
      onUnmatched?.();
      setDialog(undefined);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && (caught.status === 404 || caught.code === "match_unavailable")) {
        onUnmatched?.();
        setDialog(undefined);
        return;
      }
      setError("We could not end this match. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-safety" ref={rootRef}>
      <button
        type="button"
        className="profile-safety__trigger"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreIcon className="profile-safety__icon" />
      </button>
      {open ? (
        <div className="profile-safety__menu" id={menuId} role="menu">
          {matchId && onUnmatched ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  setDialog("unmatch");
                }}
              >
                Unmatch
              </button>
              <div className="profile-safety__separator" role="separator" />
            </>
          ) : null}
          {conversationId ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setContentReport("conversation");
              }}
            >
              Report this conversation
            </button>
          ) : null}
          {mediaId ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setContentReport("profile_media");
              }}
            >
              Report this photo
            </button>
          ) : null}
          {hookId ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setContentReport("hook");
              }}
            >
              Report this opener
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setDialog("report");
            }}
          >
            Report
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setDialog("block");
            }}
          >
            Block
          </button>
        </div>
      ) : null}

      {dialog === "report" ? (
        <Modal ariaLabel={reported ? "Report sent" : `Report ${name}`} onClose={closeDialog}>
          {reported ? (
            <div className="profile-safety-dialog">
              <p className="profile-safety-dialog__eyebrow">Report</p>
              <h2>Report received</h2>
              <p>
                Thanks. Our safety team will review it. You can also block {name} if you do not want to see them
                again.
              </p>
              {error ? (
                <p className="auth-form__error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="profile-safety-dialog__actions">
                <button className="auth-form__submit" type="button" onClick={() => void confirmBlock()} disabled={busy}>
                  {busy ? "Blocking…" : `Block ${name}`}
                </button>
                <button className="shell-text-action" type="button" onClick={closeDialog} disabled={busy}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form className="profile-safety-dialog" onSubmit={(event) => void submitReport(event)}>
              <p className="profile-safety-dialog__eyebrow">Report</p>
              <h2>Why are you reporting {name}?</h2>
              <p>Choose a reason, write what happened, or both.</p>
              <fieldset className="onboard-fieldset onboard-fieldset--plain">
                <legend className="onboard-sr-only">Reason</legend>
                <div className="onboard-chips" role="group" aria-label="Report reason">
                  {PROFILE_REPORT_REASONS.map((code) => {
                    const selected = reason === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        className="onboard-chip"
                        aria-pressed={selected}
                        data-selected={selected ? "true" : "false"}
                        onClick={() => toggleReason(code)}
                      >
                        {REPORT_REASON_LABELS[code]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="auth-field">
                <label htmlFor={`${reasonFieldId}-note`}>What happened? (optional if you chose a reason)</label>
                <textarea
                  id={`${reasonFieldId}-note`}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="You can report with just this note."
                />
              </div>
              {error ? (
                <p className="auth-form__error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="profile-safety-dialog__actions">
                <button className="auth-form__submit" type="submit" disabled={!payload || busy} aria-busy={busy}>
                  {busy ? "Sending…" : "Send report"}
                </button>
                <button className="shell-text-action" type="button" onClick={closeDialog} disabled={busy}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Modal>
      ) : null}

      {dialog === "unmatch" ? (
        <Modal ariaLabel={`End match with ${name}`} onClose={closeDialog}>
          <div className="profile-safety-dialog">
            <p className="profile-safety-dialog__eyebrow">Unmatch</p>
            <h2>End this match?</h2>
            <p>
              This ends your match with {name}. You won’t be able to keep chatting. It does not block them, and you may
              match again later.
            </p>
            {error ? (
              <p className="auth-form__error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="profile-safety-dialog__actions">
              <button className="auth-form__submit" type="button" onClick={() => void confirmUnmatch()} disabled={busy}>
                {busy ? "Ending match…" : "End match"}
              </button>
              <button className="shell-text-action" type="button" onClick={closeDialog} disabled={busy}>
                Keep match
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {contentReport === "conversation" && conversationId ? (
        <ContentReportDialog
          targetType="conversation"
          targetId={conversationId}
          name={name}
          onClose={() => setContentReport(undefined)}
        />
      ) : null}
      {contentReport === "profile_media" && mediaId ? (
        <ContentReportDialog
          targetType="profile_media"
          targetId={mediaId}
          name={name}
          onClose={() => setContentReport(undefined)}
        />
      ) : null}
      {contentReport === "hook" && hookId ? (
        <ContentReportDialog targetType="hook" targetId={hookId} name={name} onClose={() => setContentReport(undefined)} />
      ) : null}

      {dialog === "block" ? (
        <Modal ariaLabel={`Block ${name}`} onClose={closeDialog}>
          <div className="profile-safety-dialog">
            <p className="profile-safety-dialog__eyebrow">Block</p>
            <h2>Block {name}?</h2>
            <p>You will no longer be able to see each other or interact on DateZA.</p>
            {error ? (
              <p className="auth-form__error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="profile-safety-dialog__actions">
              <button className="auth-form__submit" type="button" onClick={() => void confirmBlock()} disabled={busy}>
                {busy ? "Blocking…" : `Block ${name}`}
              </button>
              <button className="shell-text-action" type="button" onClick={closeDialog} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
