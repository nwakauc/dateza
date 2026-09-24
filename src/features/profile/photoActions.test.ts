import { beforeEach, describe, expect, it, vi } from "vitest";

const prepare = vi.fn();
vi.mock("../../lib/api/imagePrep.ts", () => ({
  preparePhoto: (...args: unknown[]) => prepare(...(args as [])),
}));

import { ApiError } from "../../lib/api/errors.ts";
import { photoErrorMessage, uploadAndAttachPhoto } from "./photoActions.ts";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** jsdom Blobs need a usable arrayBuffer for the checksum path. */
function blobOf(bytes: number): Blob {
  const buffer = new ArrayBuffer(bytes);
  const blob = new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });
  Object.defineProperty(blob, "arrayBuffer", { value: async () => buffer });
  return blob;
}

/** The 9 MB camera photo that used to be refused outright. */
function hugePhoto(): File {
  const file = new File([new Uint8Array(8)], "IMG_2231.jpg", { type: "image/jpeg" });
  Object.defineProperty(file, "size", { value: 9 * 1024 * 1024 });
  return file;
}

const attachedPhoto = {
  id: 1,
  profile_id: "874c36b9-b7c5-48bd-8671-5f061c4bd895",
  position: 0,
  primary: true,
  status: "pending_review",
  visibility: "hidden",
  processing_state: "pending",
  deleted_at: null,
  image: null,
};

beforeEach(() => {
  prepare.mockReset();
});

describe("uploadAndAttachPhoto", () => {
  // The upload intent declares a byte size and MD5 that storage verifies
  // against the bytes actually PUT. Preparing after either is computed would
  // guarantee a rejected upload, so this pins the ordering that makes
  // shrinking safe — not merely that shrinking happened.
  it("hashes and declares the prepared bytes, never the picked file", async () => {
    prepare.mockResolvedValue({
      blob: blobOf(900_000),
      contentType: "image/jpeg",
      filename: "IMG_2231.jpg",
      prepared: true,
      originalBytes: 9 * 1024 * 1024,
    });

    const seen: { intentBody?: Record<string, unknown>; putBytes?: number } = {};
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.endsWith("/api/v1/profile/photos/uploads")) {
        seen.intentBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return Promise.resolve(
          jsonResponse(201, {
            upload: {
              signed_id: "signed-1",
              url: "https://storage.example/put",
              headers: {},
              expires_in: 600,
              byte_size_limit: 10_485_760,
              allowed_content_types: ["image/jpeg"],
            },
          }),
        );
      }
      if (url === "https://storage.example/put") {
        seen.putBytes = (init?.body as ArrayBuffer).byteLength;
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      if (url.endsWith("/api/v1/profile/photos")) {
        return Promise.resolve(
          init?.method === "POST"
            ? jsonResponse(201, { photo: attachedPhoto })
            : jsonResponse(200, { photos: [attachedPhoto] }),
        );
      }
      return Promise.resolve(jsonResponse(404, { error: "not_found" }));
    });

    await uploadAndAttachPhoto(hugePhoto());

    expect(seen.intentBody?.byte_size).toBe(900_000);
    expect(seen.intentBody?.byte_size).toBeLessThan(9 * 1024 * 1024);
    // The bytes sent match what the intent described.
    expect(seen.putBytes).toBe(900_000);
  });

  // The old client refused anything over a hardcoded 10 MB before trying to
  // shrink it. On a brand that requires a photo before a profile can go live,
  // that was a wall with nothing behind it.
  it("no longer refuses a large photo before trying to shrink it", async () => {
    prepare.mockResolvedValue({
      blob: blobOf(1_000),
      contentType: "image/jpeg",
      filename: "IMG_2231.jpg",
      prepared: true,
      originalBytes: 20 * 1024 * 1024,
    });
    const file = new File([new Uint8Array(8)], "IMG_2231.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 20 * 1024 * 1024 });

    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.endsWith("/api/v1/profile/photos/uploads")) {
        return Promise.resolve(
          jsonResponse(201, {
            upload: {
              signed_id: "s",
              url: "https://storage.example/put",
              headers: {},
              expires_in: 600,
              byte_size_limit: 10_485_760,
              allowed_content_types: ["image/jpeg"],
            },
          }),
        );
      }
      if (url === "https://storage.example/put") {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      return Promise.resolve(
        init?.method === "POST"
          ? jsonResponse(201, { photo: attachedPhoto })
          : jsonResponse(200, { photos: [attachedPhoto] }),
      );
    });

    await expect(uploadAndAttachPhoto(file)).resolves.toHaveLength(1);
    expect(prepare).toHaveBeenCalled();
  });

  it("reports each phase so the member can see it moving", async () => {
    prepare.mockResolvedValue({
      blob: blobOf(64),
      contentType: "image/jpeg",
      filename: "p.jpg",
      prepared: false,
      originalBytes: 64,
    });
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url.endsWith("/api/v1/profile/photos/uploads")) {
        return Promise.resolve(
          jsonResponse(201, {
            upload: {
              signed_id: "s",
              url: "https://storage.example/put",
              headers: {},
              expires_in: 600,
              byte_size_limit: 10_485_760,
              allowed_content_types: ["image/jpeg"],
            },
          }),
        );
      }
      if (url === "https://storage.example/put") {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      return Promise.resolve(
        init?.method === "POST"
          ? jsonResponse(201, { photo: attachedPhoto })
          : jsonResponse(200, { photos: [attachedPhoto] }),
      );
    });

    const phases: string[] = [];
    const progress: number[] = [];
    await uploadAndAttachPhoto(new File([new Uint8Array(4)], "p.jpg", { type: "image/jpeg" }), 0, {
      onPhase: (phase) => phases.push(phase),
      onProgress: (fraction) => progress.push(fraction),
    });

    expect(phases).toEqual(["preparing", "uploading", "finishing"]);
    expect(progress.at(-1)).toBe(1);
  });
});

describe("photoErrorMessage", () => {
  // The limit belongs to the server. Quoting its own number keeps the client
  // from carrying a copy that goes stale the day the limit changes.
  it("quotes the server's own size limit", () => {
    const error = new ApiError(422, "invalid_byte_size", "invalid_byte_size", {
      byte_size_limit: ["10485760"],
    });
    expect(photoErrorMessage(error)).toContain("10 MB");
  });

  it("stays useful when the server sends no limit", () => {
    const error = new ApiError(422, "invalid_byte_size", "invalid_byte_size");
    expect(photoErrorMessage(error)).toMatch(/too big/i);
  });

  it("explains a timeout as a connection problem, not a photo problem", () => {
    const error = new ApiError(0, "upload_timeout", "upload_timeout");
    expect(photoErrorMessage(error)).toMatch(/signal/i);
  });
});
