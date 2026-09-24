import type { PhotoContentType } from "./photoTypes.ts";

/**
 * Prepares a picked photo before it is hashed and uploaded.
 *
 * DateZA is mobile-first, and a current phone camera produces 4–15 MB images.
 * Sending those untouched is slow on a South African mobile connection, and
 * anything over the server's limit used to be refused outright with nothing
 * the member could do about it — on a brand where a photo is required before
 * a profile can go live, that is a dead end, not an inconvenience.
 *
 * Order matters: the upload intent declares the byte size and MD5 that
 * storage verifies against the bytes actually sent, so preparation MUST
 * happen before the checksum. Preparing afterwards would describe a file we
 * never upload and storage would reject the PUT.
 *
 * Decoding prefers `createImageBitmap` so the work stays off the main thread,
 * with `imageOrientation: "from-image"` because phone photos carry EXIF
 * rotation that a plain canvas draw ignores — without it, portrait photos
 * arrive sideways.
 *
 * Everything fails soft. A browser that cannot decode or re-encode simply
 * uploads the original bytes, exactly as before.
 */

/** Long edge in pixels, comfortably above anything DateZA renders. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
/** Below this, re-encoding costs more than it saves. */
const SKIP_BELOW_BYTES = 320 * 1024;

export type PreparedPhoto = {
  blob: Blob;
  contentType: PhotoContentType;
  filename: string;
  /** True when the bytes differ from the file the member picked. */
  prepared: boolean;
  originalBytes: number;
};

type Decoded = {
  width: number;
  height: number;
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void;
  release: () => void;
};

function jpegName(filename: string): string {
  const base = filename.replace(/\.[^./\\]+$/, "") || "photo";
  return `${base}.jpg`;
}

async function decodeImage(file: Blob): Promise<Decoded | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (context, width, height) => context.drawImage(bitmap, 0, 0, width, height),
        release: () => bitmap.close(),
      };
    } catch {
      // Fall through to the <img> path below.
    }
  }

  if (typeof Image !== "function" || typeof URL?.createObjectURL !== "function") {
    return null;
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("decode_failed"));
      element.src = url;
    });
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw: (context, width, height) => context.drawImage(image, 0, 0, width, height),
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", JPEG_QUALITY);
    } catch {
      resolve(null);
    }
  });
}

function original(file: File, contentType: PhotoContentType): PreparedPhoto {
  return {
    blob: file,
    contentType,
    filename: file.name || "photo",
    prepared: false,
    originalBytes: file.size,
  };
}

/**
 * Resize and re-encode a picked photo. Returns the original untouched when
 * preparation is impossible, unnecessary, or would not actually save bytes.
 */
export async function preparePhoto(
  file: File,
  contentType: PhotoContentType,
): Promise<PreparedPhoto> {
  if (file.size <= SKIP_BELOW_BYTES) return original(file, contentType);
  if (typeof document === "undefined") return original(file, contentType);

  const decoded = await decodeImage(file);
  if (!decoded || !decoded.width || !decoded.height) {
    return original(file, contentType);
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(decoded.width, decoded.height));
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return original(file, contentType);

    // JPEG has no alpha. Flatten onto white so a transparent PNG does not
    // arrive with a black background.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    decoded.draw(context, width, height);

    const blob = await canvasToBlob(canvas);
    if (!blob || blob.size >= file.size) return original(file, contentType);

    return {
      blob,
      contentType: "image/jpeg",
      filename: jpegName(file.name || "photo"),
      prepared: true,
      originalBytes: file.size,
    };
  } catch {
    return original(file, contentType);
  } finally {
    decoded.release();
  }
}
