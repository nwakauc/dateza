/**
 * Canonical label for DateZA's generic contact/email/phone verification
 * signal (the `verified` field on FindProfile/DiscoveryProfile/OwnerProfile
 * — see findTypes.ts). This is reachability confirmation only, not RealMe
 * identity/selfie verification, which does not exist yet. Every surface
 * that renders this signal should import this constant rather than
 * hardcoding its own wording — in particular, never label it "RealMe".
 */
export const VERIFIED_CONTACT_LABEL = "Verified contact";
