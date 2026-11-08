import sharp from "sharp";
import { createHash } from "node:crypto";
export const imageLimit = 10 * 1024 * 1024;
export const variantWidths = [320, 640, 1280] as const;
const mime: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heif: "image/avif",
  avif: "image/avif",
};
const extension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
export const sha256 = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
let active = 0;
export async function inspectImage(
  bytes: Buffer,
  declaredType: string,
  fileName: string,
) {
  if (bytes.length < 12 || bytes.length > imageLimit)
    throw new Error("Image must be between 12 bytes and 10 MiB.");
  const metadata = await sharp(bytes, {
    limitInputPixels: 24000000,
    failOn: "error",
    animated: false,
  }).metadata();
  const actual = mime[metadata.format || ""];
  if (
    !actual ||
    actual !== declaredType ||
    (metadata.format === "heif" && metadata.compression !== "av1")
  )
    throw new Error(
      "File content does not match an allowed JPEG, PNG, WebP or AVIF image.",
    );
  const expected = extension[actual];
  const suffix = fileName.split(".").pop()?.toLowerCase();
  if (!(suffix === expected || (expected === "jpg" && suffix === "jpeg")))
    throw new Error("Image filename extension does not match its content.");
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width < 16 ||
    metadata.height < 16 ||
    metadata.width > 12000 ||
    metadata.height > 12000 ||
    metadata.width * metadata.height > 24000000 ||
    (metadata.pages || 1) > 1
  )
    throw new Error(
      "Use a static image between 16 px and 12,000 px, with no more than 24 megapixels.",
    );
  return {
    mime_type: actual,
    extension: expected,
    width: metadata.autoOrient?.width || metadata.width,
    height: metadata.autoOrient?.height || metadata.height,
  };
}
export async function processImage(bytes: Buffer, type: string, name: string) {
  if (active >= 2)
    throw new Error("Image processor is busy. Please retry shortly.");
  active++;
  try {
    const metadata = await inspectImage(bytes, type, name);
    const variants = [];
    for (const width of variantWidths) {
      const output = await sharp(bytes, {
        limitInputPixels: 24000000,
        failOn: "error",
      })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });
      variants.push({
        variant_key: String(width),
        width: output.info.width,
        height: output.info.height,
        bytes: output.data,
        byte_size: output.data.length,
        sha256: sha256(output.data),
      });
    }
    return {
      ...metadata,
      bytes,
      sha256: sha256(bytes),
      byte_size: bytes.length,
      variants,
    };
  } finally {
    active--;
  }
}
export function descriptiveFilename(name: string) {
  return (
    name
      .normalize("NFKC")
      .replace(/[^a-zA-Z0-9._ -]/g, "-")
      .replace(/\.{2,}/g, ".")
      .slice(0, 180) || "product-image"
  );
}
