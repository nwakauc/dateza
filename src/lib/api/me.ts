import { ApiError } from "./errors.ts";
import { apiRequest } from "./client.ts";
import type { MeResponse } from "./types.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
    typeof session.expires_at !== "string"
  ) {
    throw new ApiError(502, undefined, "invalid_me_response");
  }

  return {
    user_id: data.user_id,
    brand: { slug: brand.slug, name: brand.name },
    session: { id: session.id, expires_at: session.expires_at },
  };
}

export function getCurrentIdentity(): Promise<MeResponse> {
  return apiRequest("/api/v1/me").then(parseMeResponse);
}
