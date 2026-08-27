import { md5Base64File } from "./checksum.ts";
import { apiRequest } from "./client.ts";
import { ApiError } from "./errors.ts";
import type {
  ChatMediaContentType,
  ChatMediaDelivery,
  ChatMediaKind,
  ChatMediaProcessing,
  ChatMediaUploadIntent,
  MessageAttachment,
} from "./chatMediaTypes.ts";
import { CHAT_IMAGE_CONTENT_TYPES, CHAT_VIDEO_CONTENT_TYPES } from "./chatMediaTypes.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

const MEDIA_KINDS = new Set<ChatMediaKind>(["image", "video"]);
const PROCESSING_STATES = new Set<ChatMediaProcessing>(["pending", "processing", "ready", "failed"]);
/** D8N `DELIVERY_URL_EXPIRES_IN` — re-fetch the message list for a fresh URL. */
const DELIVERY_URL_EXPIRES_IN = 300;

function deliveryFromUrl(url: unknown, source: Record<string, unknown>, filename: string): ChatMediaDelivery | null {
  if (typeof url !== "string" || url.length === 0) return null;
  return {
    url,
    url_expires_in: DELIVERY_URL_EXPIRES_IN,
    content_type: typeof source.content_type === "string" ? source.content_type : "application/octet-stream",
    filename,
    byte_size: asNumber(source.byte_size) ?? 0,
  };
}

function nullableDimension(value: unknown): number | null {
  if (value == null) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseMessageAttachment(value: unknown): MessageAttachment | undefined {
  if (!isRecord(value) || typeof value.id !== "string") return undefined;
  const kind = asString(value.media_kind);
  const processing = asString(value.processing_state);
  if (!kind || !processing || !MEDIA_KINDS.has(kind as ChatMediaKind) || !PROCESSING_STATES.has(processing as ChatMediaProcessing)) {
    return undefined;
  }
  const deleted = value.deleted === true;
  const position = asNumber(value.position) ?? 0;
  const filename = kind === "video" ? "video" : "photo";
  return {
    id: value.id,
    media_kind: kind as ChatMediaKind,
    processing_state: processing as ChatMediaProcessing,
    position,
    width: nullableDimension(value.width),
    height: nullableDimension(value.height),
    duration_seconds: nullableDimension(value.duration_seconds),
    deleted,
    content_type: asString(value.content_type) ?? null,
    byte_size: asNumber(value.byte_size) ?? null,
    display: deliveryFromUrl(value.view_url, value, filename),
    poster: deliveryFromUrl(value.poster_url, value, "poster"),
    download: deliveryFromUrl(value.download_url, value, filename),
  };
}

export function parseMessageAttachments(value: unknown): MessageAttachment[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new ApiError(502, undefined, "invalid_message_response");
  return value
    .flatMap((item) => {
      const parsed = parseMessageAttachment(item);
      return parsed ? [parsed] : [];
    })
    .slice()
    .sort((left, right) => left.position - right.position);
}

function parseUploadIntent(value: unknown): ChatMediaUploadIntent {
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
    allowed_content_types: value.allowed_content_types.filter((item): item is string => typeof item === "string"),
  };
}

/**
 * POST /api/v1/conversations/{id}/attachments/uploads
 * Same direct-to-R2 intent as profile photos. Capability-gated on D8N as
 * `chat.message.media`.
 */
export function createChatAttachmentUploadIntent(
  conversationId: string,
  input: {
    content_type: ChatMediaContentType;
    byte_size: number;
    checksum: string;
    filename?: string;
    media_kind: ChatMediaKind;
  },
): Promise<ChatMediaUploadIntent> {
  return apiRequest(`/api/v1/conversations/${encodeURIComponent(conversationId)}/attachments/uploads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((data) => {
    if (!isRecord(data)) throw new ApiError(502, undefined, "invalid_upload_response");
    return parseUploadIntent(data.upload);
  });
}

function uploadTimeoutMs(byteSize: number): number {
  const megabytes = byteSize / (1024 * 1024);
  return Math.min(600_000, Math.max(120_000, Math.ceil(2_000 * megabytes)));
}

/**
 * Direct PUT to the private R2 URL. Never goes through Rails. credentials
 * omitted so the session cookie is not sent to object storage.
 */
export function putChatMediaBytes(
  url: string,
  headers: Record<string, string>,
  body: Blob,
  options?: {
    onProgress?: (loaded: number, total: number) => void;
    signal?: AbortSignal;
  },
): Promise<void> {
  const timeoutMs = uploadTimeoutMs(body.size);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const timeout = window.setTimeout(() => {
      xhr.abort();
      reject(new ApiError(0, "upload_put_failed", "upload_put_failed"));
    }, timeoutMs);

    function finish() {
      window.clearTimeout(timeout);
      options?.signal?.removeEventListener("abort", onAbort);
    }
    function onAbort() {
      xhr.abort();
    }

    xhr.open("PUT", url);
    for (const [key, headerValue] of Object.entries(headers)) {
      xhr.setRequestHeader(key, headerValue);
    }
    xhr.withCredentials = false;
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      options?.onProgress?.(event.loaded, event.total);
    };
    xhr.onload = () => {
      finish();
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new ApiError(xhr.status, "upload_put_failed", "upload_put_failed"));
    };
    xhr.onerror = () => {
      finish();
      reject(new ApiError(0, "upload_put_failed", "upload_put_failed"));
    };
    xhr.onabort = () => {
      finish();
      reject(new ApiError(0, "upload_cancelled", "upload_cancelled"));
    };
    options?.signal?.addEventListener("abort", onAbort, { once: true });
    if (options?.signal?.aborted) {
      onAbort();
      return;
    }
    xhr.send(body);
  });
}

export function checksumChatMedia(file: Blob): Promise<string> {
  return md5Base64File(file);
}

/**
 * DELETE /api/v1/conversations/{id}/messages/{message_id}/attachments/{attachment_id}
 * Sender delete-for-everyone of one attachment. The message and any remaining
 * text stay. Recipients cannot call this (`attachment_not_owned` → 404).
 */
export function deleteMessageAttachment(
  conversationId: string,
  messageId: string,
  attachmentId: string,
): Promise<void> {
  return apiRequest(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { method: "DELETE" },
  ).then(() => undefined);
}

export function isChatImageType(value: string): value is (typeof CHAT_IMAGE_CONTENT_TYPES)[number] {
  return (CHAT_IMAGE_CONTENT_TYPES as readonly string[]).includes(value);
}

export function isChatVideoType(value: string): value is (typeof CHAT_VIDEO_CONTENT_TYPES)[number] {
  return (CHAT_VIDEO_CONTENT_TYPES as readonly string[]).includes(value);
}

export function contentTypeForChatFile(file: File, kind: ChatMediaKind): ChatMediaContentType | undefined {
  if (kind === "image") {
    if (isChatImageType(file.type)) return file.type;
    const name = file.name.toLowerCase();
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".webp")) return "image/webp";
    return undefined;
  }
  if (isChatVideoType(file.type)) return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".mov")) return "video/quicktime";
  return undefined;
}

export function chatMediaUnavailable(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 404 ||
      error.code === "matching_not_configured" ||
      error.code === "capability_unavailable" ||
      error.code === "chat_media_unavailable" ||
      error.code === "messaging_not_configured" ||
      error.code === "conversation_unavailable")
  );
}