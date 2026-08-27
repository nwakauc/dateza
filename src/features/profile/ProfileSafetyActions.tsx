import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { blockProfile, reportProfile, reportSubmission } from "../../lib/api/safety.ts";
import { PROFILE_REPORT_REASONS, type ProfileReportReason } from "../../lib/api/safetyTypes.ts";
import { Modal } from "../verification/Modal.tsx";
import { MoreIcon } from "../shell/icons.tsx";

const REASON_LABELS: Record<ProfileReportReason, string> = {
  inappropriate_content: "Inappropriate content",
  harassment: "Harassment",
  spam: "Spam",
  fake_profile: "Fake profile",
  underage: "Someone under 18",
  other: "Something else",
  violence_or_threat: "Violence or threats",
  non_consensual_content: "Non-consensual content",
  impersonation: "Impersonation",
};

type Props = {
  profileId: string;
  name: string;
  onBlocked: () => void;
};

export function ProfileSafetyActions({ profileId, name, onBlocked }: Props) {
  const menuId = useId();
  const reasonFieldId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"report" | "block" | undefined>();
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
      onBlocked();
    } catch (caught: unknown) {
      if (caught instanceof ApiError && (caught.status === 404 || caught.code === "profile_unavailable")) {
        onBlocked();
        return;
      }
      setError("We could not block this person. Try again.");
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
                        {REASON_LABELS[code]}
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
