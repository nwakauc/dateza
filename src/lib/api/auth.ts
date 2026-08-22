import { ApiError } from "./errors.ts";
import { apiRequest } from "./client.ts";
import type {
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

function parseSessionResponse(data: unknown): PasswordAuthSessionResponse {
  if (!isRecord(data)) {
    throw new ApiError(502, undefined, "invalid_auth_response");
  }
  if (
    typeof data.token !== "string" ||
    data.token === "" ||
    data.token_type !== "Bearer" ||
    typeof data.expires_at !== "string" ||
    typeof data.user_id !== "number"
  ) {
    throw new ApiError(502, undefined, "invalid_auth_response");
  }

  return {
    token: data.token,
    token_type: "Bearer",
    expires_at: data.expires_at,
    user_id: data.user_id,
    brand: parseBrand(data.brand),
  };
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
