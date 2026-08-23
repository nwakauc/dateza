import SparkMD5 from "spark-md5";

/** Base64 MD5 of file bytes. D8N upload intent requires this as `checksum`. */
export function md5Base64(buffer: ArrayBuffer): string {
  return btoa(SparkMD5.ArrayBuffer.hash(buffer, true));
}
