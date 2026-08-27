/**
 * Chat image/video attachments. Additive on Message — today's text-only
 * payloads remain valid when `attachments` is omitted.
 *
 * Wire contract is D8N MessageAttachment: flat `view_url` / `download_url` /
 * `poster_url` (present only when ready and not deleted). The nested
 * `display` / `download` / `poster` objects are a DateZA mapping for Save
 * and playback. Storage keys never appear.
 */

export const CHAT_IMAGE_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const CHAT_VIDEO_CONTENT_TYPES = ["video/mp4", "video/quicktime"] as const;

export type ChatImageContentType = (typeof CHAT_IMAGE_CONTENT_TYPES)[number];
export type ChatVideoContentType = (typeof CHAT_VIDEO_CONTENT_TYPES)[number];
export type ChatMediaContentType = ChatImageContentType | ChatVideoContentType;

export type ChatMediaKind = "image" | "video";
export type ChatMediaProcessing = "pending" | "processing" | "ready" | "failed";

/** Signed, short-lived delivery mapped from D8N's flat URL fields. */
export type ChatMediaDelivery = {
  url: string;
  url_expires_in: number;
  content_type: string;
  filename: string;
  byte_size: number;
};

export type MessageAttachment = {
  id: string;
  media_kind: ChatMediaKind;
  processing_state: ChatMediaProcessing;
  position: number;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  deleted: boolean;
  content_type: string | null;
  byte_size: number | null;
  /** Inline view/play (`view_url`). Null until ready or after delete. */
  display: ChatMediaDelivery | null;
  /** Video poster (`poster_url`). Null until the server poster is ready. */
  poster: ChatMediaDelivery | null;
  /** Save/download (`download_url`). Distinct from `display` when both exist. */
  download: ChatMediaDelivery | null;
};

export type ChatMediaUploadIntent = {
  signed_id: string;
  url: string;
  headers: Record<string, string>;
  expires_in: number;
  byte_size_limit: number;
  allowed_content_types: string[];
};

export type AttachmentUploadRef = {
  signed_id: string;
  media_kind: ChatMediaKind;
  poster_signed_id?: string;
};

export type SendMessageInput = {
  body?: string;
  attachment_uploads?: AttachmentUploadRef[];
};
