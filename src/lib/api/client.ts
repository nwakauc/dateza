import { readAppConfig } from "../config.ts";
import { ApiError } from "./errors.ts";
import { getCsrfToken, setCsrfToken } from "./csrfStore.ts";
import { getBearerToken, setBearerToken } from "./tokenStore.ts";

const REQUEST_TIMEOUT_MS = 15_000;

/** Methods that mutate state — D8N's cookie sessions require the CSRF
 * header on these; GET/HEAD/OPTIONS never carry it. */
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

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

function parseErrorDetails(data: unknown): Record<string, string[]> | undefined {
  if (!isRecord(data) || !isRecord(data.details)) {
    return undefined;
  }
  const details: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(data.details)) {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      details[key] = value;
    } else if (typeof value === "string") {
      details[key] = [value];
    }
  }
  return Object.keys(details).length > 0 ? details : undefined;
}

function parseErrorCode(data: unknown): string | undefined {
  if (!isRecord(data)) {
    return undefined;
  }
  const code = data.error;
  return typeof code === "string" ? code : undefined;
}

function parseRetryAfter(headers: Headers): number | undefined {
  const value = headers.get("Retry-After");
  if (!value) {
    return undefined;
  }
  const seconds = Number.parseInt(value, 10);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
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

  // D8N's browser session is an HttpOnly cookie, invisible to JS — this is
  // what actually authenticates the request. `credentials: "include"` is
  // required on every request (including register/login, which establish
  // the cookie) or the browser never sends/receives it. Sending this
  // alongside a bearer Authorization header is harmless: D8N picks either.
  const method = (init.method ?? "GET").toUpperCase();
  const csrfToken = getCsrfToken();
  if (csrfToken && UNSAFE_METHODS.has(method)) {
    headers.set("X-CSRF-Token", csrfToken);
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
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
      setCsrfToken(undefined);
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
      parseErrorDetails(parsed),
      response.status === 429 ? parseRetryAfter(response.headers) : undefined,
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
