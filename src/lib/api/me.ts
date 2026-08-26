import { ApiError } from "./errors.ts";
import { apiRequest } from "./client.ts";
import type {
  CloseAccountResponse,
  IdentifierKind,
  MeResponse,
  SessionIdentifierVerification,
  VerificationDispatchState,
} from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseKind(value: unknown): IdentifierKind {
  if (value === "phone" || value === "email") return value;
  throw new ApiError(502, undefined, "invalid_me_response");
}

function parseIdentifier(value: unknown): SessionIdentifierVerification | null {
  if (value === null) return null;
  if (!isRecord(value) || typeof value.verified !== "boolean" || typeof value.masked_destination !== "string") {
    throw new ApiError(502, undefined, "invalid_me_response");
  }
  return { kind: parseKind(value.kind), verified: value.verified, masked_destination: value.masked_destination };
}

function parseVerification(value: unknown): VerificationDispatchState | null {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    typeof value.code_dispatched !== "boolean" ||
    typeof value.resend_available_in !== "number" ||
    !Number.isInteger(value.resend_available_in) ||
    value.resend_available_in < 0
  ) {
    throw new ApiError(502, undefined, "invalid_me_response");
  }
  return { code_dispatched: value.code_dispatched, resend_available_in: value.resend_available_in };
}

function parseAuthenticationMode(value: unknown): "cookie" | "bearer" | undefined {
  return value === "cookie" || value === "bearer" ? value : undefined;
}

function parseMeResponse(data: unknown): MeResponse {
  if (!isRecord(data)) {
    throw new ApiError(502, undefined, "invalid_me_response");
  }

  const brand = data.brand;
  const session = data.session;
  if (
    typeof data.user_id !== "number" ||
    !isRecord(brand) ||
    typeof brand.slug !== "string" ||
    typeof brand.name !== "string" ||
    !isRecord(session) ||
    typeof session.id !== "number" ||
    typeof session.expires_at !== "string" ||
    typeof data.verification_required !== "boolean"
  ) {
    throw new ApiError(502, undefined, "invalid_me_response");
  }

  return {
    user_id: data.user_id,
    brand: { slug: brand.slug, name: brand.name },
    session: {
      id: session.id,
      expires_at: session.expires_at,
      authentication_mode: parseAuthenticationMode(session.authentication_mode),
      csrf_token: typeof session.csrf_token === "string" ? session.csrf_token : undefined,
    },
    identifier: parseIdentifier(data.identifier),
    verification_required: data.verification_required,
    verification: parseVerification(data.verification),
  };
}

export function getCurrentIdentity(): Promise<MeResponse> {
  return apiRequest("/api/v1/me").then(parseMeResponse);
}

export function closeCurrentAccount(): Promise<CloseAccountResponse> {
  return apiRequest("/api/v1/me", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmation: "close" }),
  }).then((data) => {
    if (
      !isRecord(data) ||
      data.closed !== true ||
      typeof data.already_closed !== "boolean" ||
      (data.media_purge_state !== "pending" &&
        data.media_purge_state !== "completed" &&
        data.media_purge_state !== "failed")
    ) {
      throw new ApiError(502, undefined, "invalid_account_closure_response");
    }
    return {
      closed: true,
      already_closed: data.already_closed,
      media_purge_state: data.media_purge_state,
    };
  });
}
