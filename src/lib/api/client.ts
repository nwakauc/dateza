import { readAppConfig } from "../config.ts";
import { ApiError } from "./errors.ts";
import { getBearerToken, setBearerToken } from "./tokenStore.ts";

const REQUEST_TIMEOUT_MS = 15_000;

type UnauthorizedListener = () => void;

let unauthorizedListener: UnauthorizedListener | undefined;

export function setUnauthorizedListener(
  listener: UnauthorizedListener | undefined,
): void {
  unauthorizedListener = listener;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseErrorCode(data: unknown): string | undefined {
  if (!isRecord(data)) {
    return undefined;
  }
  const code = data.error;
  return typeof code === "string" ? code : undefined;
}

export type ApiRequestOptions = {
  /** When false, do not send Authorization (register, login, recovery). */
  attachBearer?: boolean;
  /**
   * When false, a 401 does not clear the in-memory token or notify the
   * session listener. Required for signed-out auth so invalid credentials
   * cannot wipe an existing memory session.
   */
  invalidateOnUnauthorized?: boolean;
};

export async function apiRequest(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {},
): Promise<unknown> {
  const attachBearer = options.attachBearer ?? true;
  const invalidateOnUnauthorized = options.invalidateOnUnauthorized ?? true;
  const { apiUrl } = readAppConfig();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const token = attachBearer ? getBearerToken() : undefined;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "omit",
    headers,
    signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const rawText = await response.text();
  let parsed: unknown;
  if (rawText.length > 0) {
    try {
      parsed = JSON.parse(rawText) as unknown;
    } catch {
      parsed = undefined;
    }
  }

  if (response.status === 401) {
    if (invalidateOnUnauthorized) {
      setBearerToken(undefined);
      unauthorizedListener?.();
    }
    const code = parseErrorCode(parsed);
    throw new ApiError(401, code, code ?? "unauthorized");
  }

  if (!response.ok) {
    const code = parseErrorCode(parsed);
    throw new ApiError(
      response.status,
      code,
      typeof code === "string" ? code : "request_failed",
    );
  }

  if (rawText.length === 0) {
    return undefined;
  }

  if (parsed === undefined) {
    throw new ApiError(response.status, undefined, "invalid_json");
  }

  return parsed;
}
