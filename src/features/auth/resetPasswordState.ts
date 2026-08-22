export type ResetPasswordLocationState = {
  resetToken: string;
};

export function isResetPasswordLocationState(
  value: unknown,
): value is ResetPasswordLocationState {
  return (
    typeof value === "object" &&
    value !== null &&
    "resetToken" in value &&
    typeof value.resetToken === "string" &&
    value.resetToken.length > 0
  );
}
