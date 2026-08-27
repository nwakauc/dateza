import { ApiError } from "../../lib/api/errors.ts";
import {
  chatMediaUnavailable,
  checksumChatMedia,
  contentTypeForChatFile,
  createChatAttachmentUploadIntent,
  putChatMediaBytes,
} from "../../lib/api/chatMedia.ts";
import type { ChatMediaKind } from "../../lib/api/chatMediaTypes.ts";

export function chatMediaErrorMessage(error: unknown, kind: ChatMediaKind): string {
  const photo = kind === "image";
  if (error instanceof ApiError) {
    if (error.code === "upload_cancelled") return photo ? "Photo cancelled." : "Video cancelled.";
    if (chatMediaUnavailable(error)) {
      return "Photos and videos in chat aren’t available yet.";
    }
    if (error.code === "unsupported_content_type") {
      return photo ? "Use a JPEG, PNG, or WebP photo." : "Use an MP4 or MOV video.";
    }
    if (error.code === "invalid_byte_size") {
      return photo ? "That photo is too large to send." : "That video is too large to send.";
    }
    if (error.code === "invalid_image") return "That file doesn’t look like a photo. Try another.";
    if (error.code === "invalid_video" || error.code === "unsupported_codec") {
      return "That video can’t be sent. Try another clip from your phone.";
    }
    if (error.code === "upload_put_failed" || error.code === "upload_not_found") {
      return photo ? "That photo couldn’t be uploaded. Try again." : "That video couldn’t be uploaded. Try again.";
    }
    if (error.code === "upload_already_used") return "That upload was already used. Choose the file again.";
    if (error.status === 429) return "Please wait a moment, then try again.";
  }
  return photo ? "That photo couldn’t be sent. Try again." : "That video couldn’t be sent. Try again.";
}

export type ChatMediaUploadResult = {
  signedId: string;
};

export async function uploadChatMedia(
  conversationId: string,
  file: File,
  kind: ChatMediaKind,
  options?: {
    onProgress?: (loaded: number, total: number) => void;
    signal?: AbortSignal;
  },
): Promise<ChatMediaUploadResult> {
  const contentType = contentTypeForChatFile(file, kind);
  if (!contentType) {
    throw new ApiError(400, undefined, "unsupported_content_type");
  }
  if (file.size < 1) {
    throw new ApiError(400, undefined, "invalid_byte_size");
  }
  const checksum = await checksumChatMedia(file);
  if (options?.signal?.aborted) {
    throw new ApiError(0, "upload_cancelled", "upload_cancelled");
  }
  const intent = await createChatAttachmentUploadIntent(conversationId, {
    content_type: contentType,
    byte_size: file.size,
    checksum,
    filename: file.name,
    media_kind: kind,
  });
  if (file.size > intent.byte_size_limit) {
    throw new ApiError(400, undefined, "invalid_byte_size");
  }
  await putChatMediaBytes(intent.url, intent.headers, file, options);
  return { signedId: intent.signed_id };
}
