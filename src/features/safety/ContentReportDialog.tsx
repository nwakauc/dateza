import { useId, useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { reportContent, reportSubmission } from "../../lib/api/safety.ts";
import type { ContentReportTarget, ProfileReportReason } from "../../lib/api/safetyTypes.ts";
import { Modal } from "../verification/Modal.tsx";
import { contentReportCopy, contentReportReasons, REPORT_REASON_LABELS } from "./reportCopy.ts";

type Props = {
  targetType: ContentReportTarget;
  targetId: string;
  name: string;
  onClose: () => void;
};

export function ContentReportDialog({ targetType, targetId, name, onClose }: Props) {
  const reasonFieldId = useId();
  const copy = contentReportCopy(targetType, name);
  const reasons = contentReportReasons(targetType);
  const [reason, setReason] = useState<ProfileReportReason | "">("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [reported, setReported] = useState(false);
  const payload = reportSubmission(reason, note);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!payload || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await reportContent(targetType, targetId, payload);
      setReported(true);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 404) {
        setError(copy.unavailable);
      } else {
        setError("We could not send that report. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal ariaLabel={reported ? "Report sent" : copy.ariaLabel} onClose={onClose}>
      {reported ? (
        <div className="profile-safety-dialog">
          <p className="profile-safety-dialog__eyebrow">Report</p>
          <h2>Report received</h2>
          <p>
            Thanks. Our safety team will review it. You can also block {name} if you do not want to see them again.
          </p>
          <div className="profile-safety-dialog__actions">
            <button className="auth-form__submit" type="button" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form className="profile-safety-dialog" onSubmit={(event) => void submit(event)}>
          <p className="profile-safety-dialog__eyebrow">Report</p>
          <h2>{copy.heading}</h2>
          <p>{copy.body}</p>
          <fieldset className="onboard-fieldset onboard-fieldset--plain">
            <legend className="onboard-sr-only">Reason</legend>
            <div className="onboard-chips" role="group" aria-label="Report reason">
              {reasons.map((code) => {
                const selected = reason === code;
                return (
                  <button
                    key={code}
                    type="button"
                    className="onboard-chip"
                    aria-pressed={selected}
                    data-selected={selected ? "true" : "false"}
                    onClick={() => setReason((current) => (current === code ? "" : code))}
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
            <button className="auth-form__submit" type="submit" disabled={!payload || busy}>
              {busy ? "Sending…" : "Send report"}
            </button>
            <button className="shell-text-action" type="button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
