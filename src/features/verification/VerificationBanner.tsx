import type { IdentifierKind } from "../../lib/api/types.ts";

type Props = {
  kind: IdentifierKind;
  onVerify: () => void;
};

export function VerificationBanner({ kind, onVerify }: Props) {
  const noun = kind === "email" ? "email" : "phone";
  return (
    <button className="verify-banner" type="button" onClick={onVerify}>
      Verify your {noun} to start matching <span aria-hidden="true">→</span>
    </button>
  );
}
