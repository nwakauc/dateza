/**
 * Shapes copied from the verified D8N OpenAPI contract
 * (`d8n/docs/api/openapi.yaml`, MeResponse / BrandSummary / ErrorResponse /
 * PasswordAuthSessionResponse). Do not extend these with client-invented fields.
 */

import type { ProfileOnboardingStatus } from "./profileTypes.ts";

export type BrandSummary = {
  slug: string;
  name: string;
};

/** D8N `IdentifierVerificationRequest`/`IdentifierVerification`.kind enum. */
export type IdentifierKind = "phone" | "email";

export type MeResponse = {
  user_id: number;
  brand: BrandSummary;
  session: {
    id: number;
    expires_at: string;
  };
};

export type ErrorBody = {
  error: string;
};

export type MessageResponse = {
  message: string;
};

export type PasswordAuthRequest = {
  identifier: string;
  password: string;
  device_name?: string;
};

export type PasswordAuthSessionResponse = {
  token: string;
  token_type: "Bearer";
  expires_at: string;
  user_id: number;
  brand: BrandSummary;
  identifier: {
    kind: IdentifierKind;
    /** False until D8N separately proves control of the phone or email. */
    verified: boolean;
  };
  /**
   * True whenever the session's identifier is still unverified. On register
   * the server has asynchronously dispatched a verification code to
   * `verification_channel`; on login of an unverified identifier this stays
   * true (request a fresh code via `POST /api/v1/auth/verification`). Login
   * never re-sends a code by itself.
   */
  verification_required: boolean;
  verification_channel: IdentifierKind | null;
  onboarding: ProfileOnboardingStatus;
};

export type PasswordResetAuthorization = {
  reset_token: string;
  expires_at: string;
};

/** D8N `IdentifierVerificationResponse` (PATCH /api/v1/auth/verification). */
export type IdentifierVerificationResponse = {
  identifier: {
    kind: IdentifierKind;
    verified: true;
  };
};
