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
    /** Present when this session was authenticated via the D8N browser
     * (HttpOnly cookie) contract rather than a bearer token. */
    authentication_mode?: "cookie" | "bearer";
    /**
     * Issued alongside `authentication_mode: "cookie"`. Send back as
     * `X-CSRF-Token` on unsafe requests — see csrfStore.ts. Not present for
     * bearer sessions, which don't need it.
     */
    csrf_token?: string;
  };
  identifier: SessionIdentifierVerification | null;
  verification_required: boolean;
  verification: VerificationDispatchState | null;
};

export type SessionIdentifierVerification = {
  kind: IdentifierKind;
  verified: boolean;
  masked_destination: string;
};

export type VerificationDispatchState = {
  code_dispatched: boolean;
  resend_available_in: number;
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
  /** DateZA web always requests the persistent, HttpOnly-cookie session —
   * see the D8N browser-session contract. Browser-mode responses omit the
   * bearer token entirely (see `token` below). */
  session_mode?: "browser";
};

export type PasswordAuthSessionResponse = {
  /**
   * `null` in `session_mode: "browser"` responses — the session lives in an
   * HttpOnly cookie the server set on this same response, not in this body.
   * Present only for bearer-mode callers (tests, other clients).
   */
  token: string | null;
  token_type: "Bearer" | null;
  expires_at: string | null;
  user_id: number;
  brand: BrandSummary;
  identifier: SessionIdentifierVerification;
  /**
   * True whenever the session's identifier is still unverified. On register
   * the server has asynchronously dispatched a verification code to
   * `verification_channel`; on login of an unverified identifier this stays
   * true (request a fresh code via `POST /api/v1/auth/verification`). Login
   * never re-sends a code by itself.
   */
  verification_required: boolean;
  verification_channel: IdentifierKind | null;
  verification: VerificationDispatchState;
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

export type VerificationDeliveryResponse = {
  message: string;
  resend_available_in: number;
};

export type EmailChangeResponse = {
  identifier: {
    kind: "email";
    verified: true;
  };
  revoked_session_count: number;
};

export type PhoneChangeResponse = {
  identifier: {
    kind: "phone";
    verified: true;
  };
  revoked_session_count: number;
};

export type CloseAccountResponse = {
  closed: true;
  already_closed: boolean;
  media_purge_state: "pending" | "completed" | "failed";
};
