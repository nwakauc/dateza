import { ApiError } from "../../lib/api/errors.ts";

/** D8N returns this when the other member is gone, hidden, blocked, or otherwise not likeable. */
export function likeBackUnavailable(error: unknown): boolean {
  return error instanceof ApiError && (error.code === "profile_unavailable" || error.status === 404);
}

export function likeBackErrorCopy(error: unknown): string {
  if (likeBackUnavailable(error)) {
    return "This person isn’t available to like back.";
  }
  return "That didn’t work. Try again.";
}
