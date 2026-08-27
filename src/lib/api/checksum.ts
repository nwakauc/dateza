import SparkMD5 from "spark-md5";

/** Base64 MD5 of file bytes. D8N upload intent requires this as `checksum`. */
export function md5Base64(buffer: ArrayBuffer): string {
  return btoa(SparkMD5.ArrayBuffer.hash(buffer, true));
}

const HASH_CHUNK_BYTES = 2 * 1024 * 1024;

/** Base64 MD5 of a Blob without holding the whole file in one ArrayBuffer. */
export function md5Base64File(file: Blob): Promise<string> {
  if (file.size <= HASH_CHUNK_BYTES) {
    return file.arrayBuffer().then(md5Base64);
  }
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();
    let offset = 0;
    reader.onerror = () => reject(reader.error ?? new Error("checksum_read_failed"));
    reader.onload = () => {
      const chunk = reader.result;
      if (!(chunk instanceof ArrayBuffer)) {
        reject(new Error("checksum_read_failed"));
        return;
      }
      spark.append(chunk);
      offset += chunk.byteLength;
      if (offset < file.size) {
        readNext();
        return;
      }
      resolve(btoa(spark.end(true)));
    };
    function readNext() {
      reader.readAsArrayBuffer(file.slice(offset, Math.min(offset + HASH_CHUNK_BYTES, file.size)));
    }
    readNext();
  });
}
