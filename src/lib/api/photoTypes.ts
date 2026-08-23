/**
 * Owner photo shapes from the verified D8N OpenAPI contract
 * (`d8n/docs/api/openapi.yaml`: ProfilePhoto, ProfilePhotoImage, ProfilePhotoUpload).
 */

export const PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type PhotoContentType = (typeof PHOTO_CONTENT_TYPES)[number];

export type PhotoStatus = "pending_review" | "approved" | "rejected";
export type PhotoVisibility = "hidden" | "visible";
export type PhotoProcessingState = "pending" | "processing" | "ready" | "failed";

export type OwnerPhotoImage = {
  filename: string;
  content_type: string;
  byte_size: number;
  url: string;
  url_expires_in: number;
};

export type OwnerPhoto = {
  id: number;
  profile_id: string;
  position: number;
  status: PhotoStatus;
  visibility: PhotoVisibility;
  processing_state: PhotoProcessingState;
  deleted_at: string | null;
  image: OwnerPhotoImage | null;
};

export type PhotoUploadIntent = {
  signed_id: string;
  url: string;
  headers: Record<string, string>;
  expires_in: number;
  byte_size_limit: number;
  allowed_content_types: string[];
};
