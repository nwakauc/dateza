import { ApiError } from "../../lib/api/errors.ts";
import { md5Base64File } from "../../lib/api/checksum.ts";
import { preparePhoto } from "../../lib/api/imagePrep.ts";
import {
  attachOwnerPhoto,
  createPhotoUploadIntent,
  deleteOwnerPhoto,
  isAllowedPhotoType,
  listOwnerPhotos,
  putPhotoBytes,
} from "../../lib/api/photos.ts";
import type { OwnerPhoto, PhotoContentType } from "../../lib/api/photoTypes.ts";

/** What the member is waiting on, for copy that says something true. */
export type PhotoUploadPhase = "preparing" | "uploading" | "finishing";

export type PhotoUploadHandlers = {
  onPhase?: (phase: PhotoUploadPhase) => void;
  /** 0..1 of the bytes sent so far. */
  onProgress?: (fraction: number) => void;
};

function megabytes(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`;
}

export function photoErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "unsupported_content_type") return "Use a JPEG, PNG, or WebP photo.";
    if (error.code === "invalid_byte_size") {
      // The limit belongs to the server, so quote the server's own number
      // rather than a copy that silently goes stale.
      const limit = error.details?.byte_size_limit?.[0];
      const asNumber = limit === undefined ? Number.NaN : Number(limit);
      return Number.isFinite(asNumber)
        ? `That photo is too big, even after we shrank it. Try one under ${megabytes(asNumber)}.`
        : "That photo is too big, even after we shrank it. Try another one.";
    }
    if (error.code === "invalid_image") return "That file doesn’t look like a photo. Try another.";
    if (error.code === "upload_timeout") {
      return "That took too long to upload. Try again when your signal is stronger.";
    }
    if (error.code === "upload_put_failed" || error.code === "upload_not_found") {
      return "That photo couldn't be uploaded. Try again.";
    }
    if (error.code === "upload_already_used") return "That upload was already used. Choose the photo again.";
  }
  return "That photo couldn't be uploaded. Try again.";
}

export function contentTypeForPhoto(file: File): PhotoContentType | undefined {
  if (isAllowedPhotoType(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return undefined;
}

/**
 * The single upload path for every photo DateZA sends.
 *
 * There is deliberately no client-side size limit here. The old one was a
 * hardcoded copy of a server rule that rejected the picked file before
 * anything had tried to make it smaller — so a large camera photo was an
 * unrecoverable wall on a brand that requires a photo before a profile can go
 * live. Preparation now runs first, which brings virtually every phone photo
 * comfortably under, and the server stays the authority on the limit: if it
 * still refuses, its own `byte_size_limit` is what the member is told.
 */
export async function uploadAndAttachPhoto(
  file: File,
  position?: number,
  handlers?: PhotoUploadHandlers,
): Promise<OwnerPhoto[]> {
  const contentType = contentTypeForPhoto(file);
  if (!contentType) {
    throw new ApiError(400, "unsupported_content_type", "unsupported_content_type");
  }
  if (file.size < 1) {
    throw new ApiError(400, "invalid_image", "invalid_image");
  }

  handlers?.onPhase?.("preparing");
  const prepared = await preparePhoto(file, contentType);
  // Hash and declare the bytes we are actually going to send. Preparing after
  // either of these would describe a file we never upload, and storage
  // verifies both against the PUT body.
  const bytes = await prepared.blob.arrayBuffer();
  const checksum = await md5Base64File(prepared.blob);

  const intent = await createPhotoUploadIntent({
    content_type: prepared.contentType,
    byte_size: bytes.byteLength,
    checksum,
    filename: prepared.filename,
  });

  handlers?.onPhase?.("uploading");
  await putPhotoBytes(intent.url, intent.headers, bytes, handlers?.onProgress);

  handlers?.onPhase?.("finishing");
  await attachOwnerPhoto(intent.signed_id, position);
  return listOwnerPhotos();
}

export async function replaceOwnerPhoto(
  file: File,
  existingId: number,
  handlers?: PhotoUploadHandlers,
): Promise<OwnerPhoto[]> {
  const next = await uploadAndAttachPhoto(file, undefined, handlers);
  await deleteOwnerPhoto(existingId);
  return listOwnerPhotos().catch(() => next);
}
