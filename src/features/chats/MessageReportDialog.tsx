import { useId, useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api/errors.ts";
import { reportMessage, reportSubmission } from "../../lib/api/safety.ts";
import { type ProfileReportReason } from "../../lib/api/safetyTypes.ts";
import { Modal } from "../verification/Modal.tsx";

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

const MESSAGE_REPORT_REASONS: ProfileReportReason[] = [
  "inappropriate_content",
  "harassment",
  "spam",
  "underage",
  "violence_or_threat",
  "non_consensual_content",
  "other",
];

type Props = {
  messageId: string;
  name: string;
  onClose: () => void;
};

export function MessageReportDialog({ messageId, name, onClose }: Props) {
  const reasonFieldId = useId();
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
      await reportMessage(messageId, payload);
      setReported(true);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 404) {
        setError("That message isn’t available to report.");
      } else {
        setError("We could not send that report. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal ariaLabel={reported ? "Report sent" : `Report a message from ${name}`} onClose={onClose}>
      {reported ? (
        <div className="profile-safety-dialog">
          <p className="profile-safety-dialog__eyebrow">Report</p>
          <h2>Report received</h2>
          <p>Thanks. Our safety team will review it. You can also block {name} from the chat menu if you do not want to hear from them.</p>
          <div className="profile-safety-dialog__actions">
            <button className="auth-form__submit" type="button" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form className="profile-safety-dialog" onSubmit={(event) => void submit(event)}>
          <p className="profile-safety-dialog__eyebrow">Report</p>
          <h2>Why are you reporting this?</h2>
          <p>This report is about a message from {name}. Choose a reason, write what happened, or both.</p>
          <fieldset className="onboard-fieldset onboard-fieldset--plain">
            <legend className="onboard-sr-only">Reason</legend>
            <div className="onboard-chips" role="group" aria-label="Report reason">
              {MESSAGE_REPORT_REASONS.map((code) => {
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
