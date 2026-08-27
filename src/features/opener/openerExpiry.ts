/** Relative expiry for live openers. Does not distinguish why an opener ends. */
export function openerExpiryCopy(iso: string, now = new Date()): string {
  const expires = new Date(iso);
  if (Number.isNaN(expires.getTime())) return "";
  const ms = expires.getTime() - now.getTime();
  if (ms <= 0) return "Expired";
  const hours = Math.round(ms / 3_600_000);
  if (hours < 1) return "Expires soon";
  if (hours < 24) return `Expires in ${hours}h`;
  const days = Math.round(hours / 24);
  return `Expires in ${days}d`;
}
