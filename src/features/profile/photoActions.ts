import { ApiError } from "../../lib/api/errors.ts";
import { md5Base64 } from "../../lib/api/checksum.ts";
import {
  attachOwnerPhoto,
  createPhotoUploadIntent,
  deleteOwnerPhoto,
  isAllowedPhotoType,
  listOwnerPhotos,
  putPhotoBytes,
} from "../../lib/api/photos.ts";
import type { OwnerPhoto } from "../../lib/api/photoTypes.ts";

export function photoErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "unsupported_content_type") return "Use a JPEG, PNG, or WebP photo.";
    if (error.code === "invalid_byte_size") return "That photo is too large. Choose one under 10 MB.";
    if (error.code === "invalid_image") return "That file doesn’t look like a photo. Try another.";
    if (error.code === "upload_put_failed" || error.code === "upload_not_found") {
      return "That photo couldn't be uploaded. Try again.";
    }
    if (error.code === "upload_already_used") return "That upload was already used. Choose the photo again.";
  }
  return "That photo couldn't be uploaded. Try again.";
}

export function contentTypeForPhoto(file: File): string | undefined {
  if (isAllowedPhotoType(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return undefined;
}

export async function uploadAndAttachPhoto(file: File, position?: number): Promise<OwnerPhoto[]> {
  const contentType = contentTypeForPhoto(file);
  if (!contentType) {
    throw new ApiError(400, undefined, "unsupported_content_type");
  }
  if (file.size < 1 || file.size > 10 * 1024 * 1024) {
    throw new ApiError(400, undefined, "invalid_byte_size");
  }
  const bytes = await file.arrayBuffer();
  const intent = await createPhotoUploadIntent({
    content_type: contentType,
    byte_size: bytes.byteLength,
    checksum: md5Base64(bytes),
    filename: file.name,
  });
  await putPhotoBytes(intent.url, intent.headers, bytes);
  await attachOwnerPhoto(intent.signed_id, position);
  return listOwnerPhotos();
}

export async function replaceOwnerPhoto(file: File, existingId: number): Promise<OwnerPhoto[]> {
  const next = await uploadAndAttachPhoto(file);
  await deleteOwnerPhoto(existingId);
  return listOwnerPhotos().catch(() => next);
}
