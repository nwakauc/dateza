import { ApiError } from "./errors.ts";
import { apiRequest } from "./client.ts";
import type {
  OwnerPhoto,
  OwnerPhotoImage,
  PhotoProcessingState,
  PhotoStatus,
  PhotoUploadIntent,
  PhotoVisibility,
} from "./photoTypes.ts";
import { PHOTO_CONTENT_TYPES } from "./photoTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

const PHOTO_STATUSES = new Set<PhotoStatus>(["pending_review", "approved", "rejected"]);
const PHOTO_VISIBILITIES = new Set<PhotoVisibility>(["hidden", "visible"]);
const PROCESSING_STATES = new Set<PhotoProcessingState>([
  "pending",
  "processing",
  "ready",
  "failed",
]);

function parseImage(value: unknown): OwnerPhotoImage | null {
  if (value === null) {
    return null;
  }
  if (
    !isRecord(value) ||
    typeof value.filename !== "string" ||
    typeof value.content_type !== "string" ||
    typeof value.byte_size !== "number" ||
    typeof value.url !== "string" ||
    typeof value.url_expires_in !== "number"
  ) {
    throw new ApiError(502, undefined, "invalid_photo_response");
  }
  return {
    filename: value.filename,
    content_type: value.content_type,
    byte_size: value.byte_size,
    url: value.url,
    url_expires_in: value.url_expires_in,
  };
}

export function parseOwnerPhoto(value: unknown): OwnerPhoto {
  if (!isRecord(value) || typeof value.id !== "number") {
    throw new ApiError(502, undefined, "invalid_photo_response");
  }
  const status = asString(value.status);
  const visibility = asString(value.visibility);
  const processing = asString(value.processing_state);
  const profileId = asString(value.profile_id);
  const position = asNumber(value.position);
  if (
    profileId === undefined ||
    position === undefined ||
    status === undefined ||
    !PHOTO_STATUSES.has(status as PhotoStatus) ||
    visibility === undefined ||
    !PHOTO_VISIBILITIES.has(visibility as PhotoVisibility) ||
    processing === undefined ||
    !PROCESSING_STATES.has(processing as PhotoProcessingState)
  ) {
    throw new ApiError(502, undefined, "invalid_photo_response");
  }
  const deletedAt = value.deleted_at;
  if (deletedAt !== null && typeof deletedAt !== "string") {
    throw new ApiError(502, undefined, "invalid_photo_response");
  }
  return {
    id: value.id,
    profile_id: profileId,
    position,
    status: status as PhotoStatus,
    visibility: visibility as PhotoVisibility,
    processing_state: processing as PhotoProcessingState,
    deleted_at: deletedAt,
    image: parseImage(value.image),
  };
}

function parseUploadIntent(value: unknown): PhotoUploadIntent {
  if (!isRecord(value)) {
    throw new ApiError(502, undefined, "invalid_upload_response");
  }
  const signedId = asString(value.signed_id);
  const url = asString(value.url);
  const expiresIn = asNumber(value.expires_in);
  const byteSizeLimit = asNumber(value.byte_size_limit);
  if (
    signedId === undefined ||
    url === undefined ||
    expiresIn === undefined ||
    byteSizeLimit === undefined ||
    !isRecord(value.headers) ||
    !Array.isArray(value.allowed_content_types)
  ) {
    throw new ApiError(502, undefined, "invalid_upload_response");
  }
  const headers: Record<string, string> = {};
  for (const [key, headerValue] of Object.entries(value.headers)) {
    if (typeof headerValue === "string") {
      headers[key] = headerValue;
    }
  }
  return {
    signed_id: signedId,
    url,
    headers,
    expires_in: expiresIn,
    byte_size_limit: byteSizeLimit,
    allowed_content_types: value.allowed_content_types.filter(
      (item): item is string => typeof item === "string",
    ),
  };
}

export function listOwnerPhotos(): Promise<OwnerPhoto[]> {
  return apiRequest("/api/v1/profile/photos").then((data) => {
    if (!isRecord(data) || !Array.isArray(data.photos)) {
      throw new ApiError(502, undefined, "invalid_photo_response");
    }
    return data.photos
      .map(parseOwnerPhoto)
      .filter((photo) => photo.deleted_at === null)
      .sort((left, right) => left.position - right.position || left.id - right.id);
  });
}

export function createPhotoUploadIntent(input: {
  content_type: string;
  byte_size: number;
  checksum: string;
  filename?: string;
}): Promise<PhotoUploadIntent> {
  return apiRequest("/api/v1/profile/photos/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_upload_response");
    }
    return parseUploadIntent(data.upload);
  });
}

export async function putPhotoBytes(
  url: string,
  headers: Record<string, string>,
  body: ArrayBuffer,
): Promise<void> {
  const response = await fetch(url, {
    method: "PUT",
    headers,
    body,
    credentials: "omit",
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) {
    throw new ApiError(response.status, undefined, "upload_put_failed");
  }
}

export function attachOwnerPhoto(signedId: string, position?: number): Promise<OwnerPhoto> {
  const body: { signed_id: string; position?: number } = { signed_id: signedId };
  if (position !== undefined) {
    body.position = position;
  }
  return apiRequest("/api/v1/profile/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((data) => {
    if (!isRecord(data)) {
      throw new ApiError(502, undefined, "invalid_photo_response");
    }
    return parseOwnerPhoto(data.photo);
  });
}

export function deleteOwnerPhoto(id: number): Promise<void> {
  return apiRequest(`/api/v1/profile/photos/${id}`, { method: "DELETE" }).then(() => undefined);
}

export function isAllowedPhotoType(value: string): value is (typeof PHOTO_CONTENT_TYPES)[number] {
  return (PHOTO_CONTENT_TYPES as readonly string[]).includes(value);
}
