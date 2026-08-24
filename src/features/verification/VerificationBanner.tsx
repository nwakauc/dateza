import type { IdentifierKind } from "../../lib/api/types.ts";

type Props = {
  kind: IdentifierKind;
  onVerify: () => void;
};

export function VerificationBanner({ kind, onVerify }: Props) {
  const noun = kind === "email" ? "email" : "phone";
  return (
    <button className="verify-banner" type="button" onClick={onVerify}>
      <span>Verify your {noun} to start connecting.</span>
      <strong>Verify now <span aria-hidden="true">→</span></strong>
    </button>
  );
}
