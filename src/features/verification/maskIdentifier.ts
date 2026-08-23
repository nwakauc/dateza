import type { IdentifierKind } from "../../lib/api/types.ts";

/**
 * D8N never returns the raw email/phone (register, login, and /api/v1/me all
 * omit it), so this only ever masks what the member typed into this tab's
 * sign-in/sign-up form. Purely a display helper — never sent anywhere.
 */
export function maskIdentifier(kind: IdentifierKind, raw: string): string {
  if (kind === "email") {
    const at = raw.indexOf("@");
    if (at <= 0) {
      return raw;
    }
    const local = raw.slice(0, at);
    const domain = raw.slice(at);
    const visible = local.slice(0, 1);
    return `${visible}${"•".repeat(Math.max(local.length - 1, 3))}${domain}`;
  }

  const digits = raw.replace(/\D/g, "");
  const last = digits.slice(-3);
  const hiddenCount = Math.max(digits.length - last.length, 4);
  const prefix = raw.trim().startsWith("+") ? "+" : "";
  return `${prefix}${"•".repeat(hiddenCount)}${last}`;
}
