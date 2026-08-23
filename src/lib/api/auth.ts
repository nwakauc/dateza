import { ApiError } from "./errors.ts";
import { apiRequest } from "./client.ts";
import { parseOnboardingStatus } from "./profile.ts";
import type {
  IdentifierKind,
  IdentifierVerificationResponse,
  MessageResponse,
  PasswordAuthRequest,
  PasswordAuthSessionResponse,
  PasswordResetAuthorization,
} from "./types.ts";

const PUBLIC_AUTH: { attachBearer: false; invalidateOnUnauthorized: false } = {
  attachBearer: false,
  invalidateOnUnauthorized: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBrand(value: unknown): PasswordAuthSessionResponse["brand"] {
  if (!isRecord(value) || typeof value.slug !== "string" || typeof value.name !== "string") {
    throw new ApiError(502, undefined, "invalid_auth_response");
  }
  return { slug: value.slug, name: value.name };
}

function parseIdentifierKind(value: unknown): IdentifierKind {
  if (value === "phone" || value === "email") {
    return value;
  }
  throw new ApiError(502, undefined, "invalid_auth_response");
}

function parseIdentifier(value: unknown): PasswordAuthSessionResponse["identifier"] {
  if (!isRecord(value) || typeof value.verified !== "boolean") {
    throw new ApiError(502, undefined, "invalid_auth_response");
  }
  return { kind: parseIdentifierKind(value.kind), verified: value.verified };
}

function parseSessionResponse(data: unknown): PasswordAuthSessionResponse {
  if (!isRecord(data)) {
    throw new ApiError(502, undefined, "invalid_auth_response");
  }
  if (
    typeof data.token !== "string" ||
    data.token === "" ||
    data.token_type !== "Bearer" ||
    typeof data.expires_at !== "string" ||
    typeof data.user_id !== "number" ||
    typeof data.verification_required !== "boolean"
  ) {
    throw new ApiError(502, undefined, "invalid_auth_response");
  }

  return {
    token: data.token,
    token_type: "Bearer",
    expires_at: data.expires_at,
    user_id: data.user_id,
    brand: parseBrand(data.brand),
    identifier: parseIdentifier(data.identifier),
    verification_required: data.verification_required,
    verification_channel:
      data.verification_channel === null ? null : parseIdentifierKind(data.verification_channel),
    onboarding: parseOnboardingStatus(data.onboarding),
  };
}

function parseIdentifierVerificationResponse(data: unknown): IdentifierVerificationResponse {
  if (!isRecord(data) || !isRecord(data.identifier) || data.identifier.verified !== true) {
    throw new ApiError(502, undefined, "invalid_verification_response");
  }
  return { identifier: { kind: parseIdentifierKind(data.identifier.kind), verified: true } };
}

function parseMessage(data: unknown): MessageResponse {
  if (!isRecord(data) || typeof data.message !== "string") {
    throw new ApiError(502, undefined, "invalid_message_response");
  }
  return { message: data.message };
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

const DEVICE_NAME = "DateZA web";

export function registerWithPassword(
  identifier: string,
  password: string,
): Promise<PasswordAuthSessionResponse> {
  const body: PasswordAuthRequest = {
    identifier,
    password,
    device_name: DEVICE_NAME,
  };
  return apiRequest(
    "/api/v1/auth/password/register",
    jsonInit("POST", body),
    PUBLIC_AUTH,
  ).then(parseSessionResponse);
}

export function loginWithPassword(
  identifier: string,
  password: string,
): Promise<PasswordAuthSessionResponse> {
  const body: PasswordAuthRequest = {
    identifier,
    password,
    device_name: DEVICE_NAME,
  };
  return apiRequest(
    "/api/v1/auth/password/login",
    jsonInit("POST", body),
    PUBLIC_AUTH,
  ).then(parseSessionResponse);
}

export function revokeCurrentSession(): Promise<void> {
  return apiRequest("/api/v1/auth/session", { method: "DELETE" }).then(() => undefined);
}

export function requestPasswordRecovery(identifier: string): Promise<MessageResponse> {
  return apiRequest(
    "/api/v1/auth/password/recovery",
    jsonInit("POST", { identifier }),
    PUBLIC_AUTH,
  ).then(parseMessage);
}

export function verifyPasswordRecovery(
  identifier: string,
  code: string,
): Promise<PasswordResetAuthorization> {
  return apiRequest(
    "/api/v1/auth/password/recovery/verify",
    jsonInit("POST", { identifier, code }),
    PUBLIC_AUTH,
  ).then((data) => {
    if (
      !isRecord(data) ||
      typeof data.reset_token !== "string" ||
      data.reset_token === "" ||
      typeof data.expires_at !== "string"
    ) {
      throw new ApiError(502, undefined, "invalid_reset_authorization");
    }
    return { reset_token: data.reset_token, expires_at: data.expires_at };
  });
}

export function resetPasswordWithRecovery(
  resetToken: string,
  password: string,
  passwordConfirmation: string,
): Promise<MessageResponse> {
  return apiRequest(
    "/api/v1/auth/password/recovery/reset",
    jsonInit("POST", {
      reset_token: resetToken,
      password,
      password_confirmation: passwordConfirmation,
    }),
    PUBLIC_AUTH,
  ).then(parseMessage);
}

/** POST /api/v1/auth/verification — sends a fresh code to the current user's
 * own unverified identifier. Requires a bearer session. */
export function requestIdentifierVerification(kind: IdentifierKind): Promise<MessageResponse> {
  return apiRequest(
    "/api/v1/auth/verification",
    jsonInit("POST", { kind }),
  ).then(parseMessage);
}

/**
 * PATCH /api/v1/auth/verification — consumes a code and marks the current
 * user's matching identifier verified.
 *
 * Per the D8N contract, a wrong/expired/consumed code returns 401 on this
 * endpoint — that is NOT the bearer session expiring, so `apiRequest`'s
 * default "401 clears the session" behavior must be disabled here, or a
 * mistyped code would silently sign the member out.
 */
export function verifyIdentifier(
  kind: IdentifierKind,
  code: string,
): Promise<IdentifierVerificationResponse> {
  return apiRequest(
    "/api/v1/auth/verification",
    jsonInit("PATCH", { kind, code }),
    { invalidateOnUnauthorized: false },
  ).then(parseIdentifierVerificationResponse);
}
