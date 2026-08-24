/**
 * DateZA Discover — curated daily selection (10/day), a separate product
 * and allowance from Find (see findTypes.ts). Backed by `GET /api/v1/discovery`.
 *
 * The candidate profile shape is the same "safe public candidate" contract
 * Find already uses, so we reuse `FindProfile` rather than redeclare it.
 */

import type { FindProfile } from "./findTypes.ts";

export type DiscoveryProfile = FindProfile;

/**
 * `count` is the number of profiles currently safe/eligible to deliver in
 * this allocation — NOT a remaining allowance. Never render it as
 * "X remaining" or "X left". `daily_limit` is the configured batch size.
 */
export type DiscoverySelection = {
  allocation_date: string;
  daily_limit: number;
  count: number;
  finalized: boolean;
  refreshes_at: string;
};

export type DiscoveryResponse = {
  profiles: DiscoveryProfile[];
  selection: DiscoverySelection;
};
