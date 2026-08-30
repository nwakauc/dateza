/**
 * Brand-scoped admin growth analytics from D8N.
 * DateZA must not compute these client-side from paginated member lists.
 *
 * GET /api/v1/hq/analytics/overview
 * Capability: hq.analytics.read
 * Brand: host-resolved only; week boundaries Sun 00:00–Sat 23:59 brand TZ;
 * month boundaries calendar month from day 1.
 */
export const OPS_ANALYTICS_METRICS = [
  "signups_today",
  "signups_this_week",
  "signups_this_month",
  "active_today",
  "active_7d",
  "active_30d",
  "gender_split",
  "total_registered_members",
] as const;
