import { describe, expect, it, vi } from "vitest";
import { attachOwnerPhoto, createPhotoUploadIntent, listOwnerPhotos } from "./photos.ts";

/**
 * Fixtures are the real response bodies captured against DateZA staging
 * (dateza-staging-api.d8n.tech) on 2026-08-25 while uploading two photos
 * back to back during onboarding — the exact sequence the regression
 * report described as corrupting later photo slots.
 */

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const realUploadIntent = {
  upload: {
    signed_id: "eyJfcmFpbHMiOnsiZGF0YSI6NjI5LCJwdXIiOiJibG9iX2lkIn19--4ef5306893e05f2e95e1c71a4af7f8f41dfc89a2",
    url: "https://storage.example/r2/photos/original.jpg?X-Amz-Signature=abc",
    headers: {
      "Content-Type": "image/jpeg",
      "Content-MD5": "2cc2S9lhBxkiMwij5IxfUA==",
      "Content-Disposition": 'inline; filename="test1.jpg"; filename*=UTF-8\'\'test1.jpg',
    },
    expires_in: 600,
    byte_size_limit: 10_485_760,
    allowed_content_types: ["image/jpeg", "image/png", "image/webp"],
  },
};

function realAttachedPhoto(id: number, position: number, filename: string) {
  return {
    photo: {
      id,
      profile_id: "874c36b9-b7c5-48bd-8671-5f061c4bd895",
      position,
      status: "pending_review",
      visibility: "hidden",
      processing_state: "pending",
      deleted_at: null,
      image: {
        filename,
        content_type: "image/jpeg",
        byte_size: 2162,
        url: "https://storage.example/r2/photos/original.jpg?X-Amz-Signature=def",
        url_expires_in: 300,
      },
    },
  };
}

const realTwoPhotoList = {
  photos: [
    {
      id: 351,
      profile_id: "874c36b9-b7c5-48bd-8671-5f061c4bd895",
      position: 1,
      status: "pending_review",
      visibility: "hidden",
      processing_state: "ready",
      deleted_at: null,
      image: {
        filename: "display.jpg",
        content_type: "image/jpeg",
        byte_size: 1447,
        url: "https://storage.example/r2/photos/display.jpg?X-Amz-Signature=ghi",
        url_expires_in: 300,
      },
    },
    {
      id: 352,
      profile_id: "874c36b9-b7c5-48bd-8671-5f061c4bd895",
      position: 2,
      status: "pending_review",
      visibility: "hidden",
      processing_state: "ready",
      deleted_at: null,
      image: {
        filename: "display.jpg",
        content_type: "image/jpeg",
        byte_size: 1917,
        url: "https://storage.example/r2/photos/display-2.jpg?X-Amz-Signature=jkl",
        url_expires_in: 300,
      },
    },
  ],
};

describe("photo upload/list parsing against real staging response shapes", () => {
  it("parses a real upload intent response", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(201, realUploadIntent));

    const intent = await createPhotoUploadIntent({
      content_type: "image/jpeg",
      byte_size: 2162,
      checksum: "2cc2S9lhBxkiMwij5IxfUA==",
      filename: "test1.jpg",
    });

    expect(intent.signed_id).toBe(realUploadIntent.upload.signed_id);
    expect(intent.allowed_content_types).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });

  it("parses the first and second attached photo independently, at distinct positions", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(201, realAttachedPhoto(351, 1, "test1.jpg")))
      .mockResolvedValueOnce(jsonResponse(201, realAttachedPhoto(352, 2, "test2.jpg")));

    const first = await attachOwnerPhoto("signed-1");
    const second = await attachOwnerPhoto("signed-2");

    expect(first.id).toBe(351);
    expect(first.position).toBe(1);
    expect(second.id).toBe(352);
    expect(second.position).toBe(2);
    expect(first.image?.filename).toBe("test1.jpg");
    expect(second.image?.filename).toBe("test2.jpg");
  });

  it("parses and orders a real two-photo list once processing has finished", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, realTwoPhotoList));

    const photos = await listOwnerPhotos();

    expect(photos).toHaveLength(2);
    expect(photos[0]?.id).toBe(351);
    expect(photos[0]?.processing_state).toBe("ready");
    expect(photos[1]?.id).toBe(352);
    expect(photos[1]?.processing_state).toBe("ready");
  });
});
