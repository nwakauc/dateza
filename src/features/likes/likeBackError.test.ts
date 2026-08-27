import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api/errors.ts";
import { likeBackErrorCopy, likeBackUnavailable } from "./likeBackError.ts";

describe("like-back failure copy", () => {
  it("maps profile_unavailable without asking the member to try again", () => {
    const error = new ApiError(404, "profile_unavailable", "gone");
    expect(likeBackUnavailable(error)).toBe(true);
    expect(likeBackErrorCopy(error)).toBe("This person isn’t available to like back.");
    expect(likeBackErrorCopy(error)).not.toMatch(/try again/i);
  });

  it("keeps a retry path for transient failures", () => {
    expect(likeBackUnavailable(new Error("network"))).toBe(false);
    expect(likeBackErrorCopy(new Error("network"))).toMatch(/try again/i);
  });
});
