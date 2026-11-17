import "server-only";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
export const ALLOWED_UPLOAD_FOLDERS = new Set(["products", "stores"]);
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIME_BY_EXT = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const UPLOAD_ROOT = path.resolve(process.cwd(), "public", "uploads");
const UPLOAD_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

export class UploadValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "UploadValidationError";
    this.status = status;
  }
}

function detectImageSignature(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

/**
 * Validate image size, MIME type, and magic bytes, then persist under public/uploads/<folder>.
 */
export async function saveUploadedImage(file, folder) {
  if (!ALLOWED_UPLOAD_FOLDERS.has(folder)) {
    throw new UploadValidationError("Folder unggahan tidak valid.", 400);
  }

  if (!file || typeof file.arrayBuffer !== "function" || typeof file.size !== "number") {
    throw new UploadValidationError("File gambar wajib diunggah.", 400);
  }

  if (file.size <= 0) {
    throw new UploadValidationError("File gambar tidak boleh kosong.", 400);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError("Ukuran gambar maksimal 2 MB.", 400);
  }

  if (file.type && !ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    throw new UploadValidationError(
      "Format gambar harus JPEG, PNG, atau WebP.",
      400
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength <= 0 || buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError("Ukuran gambar maksimal 2 MB.", 400);
  }

  const detected = detectImageSignature(buffer);
  if (!detected) {
    throw new UploadValidationError(
      "Isi file bukan gambar JPEG, PNG, atau WebP yang valid.",
      400
    );
  }

  if (file.type && file.type !== detected.mime) {
    throw new UploadValidationError(
      "Tipe file tidak sesuai dengan format gambar sebenarnya.",
      400
    );
  }

  const filename = `${crypto.randomUUID()}.${detected.ext}`;
  const targetDir = path.join(UPLOAD_ROOT, folder);
  const targetPath = path.join(targetDir, filename);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetPath, buffer);

  return `/uploads/${folder}/${filename}`;
}

/**
 * Resolve a safe local upload path inside public/uploads for reading or deletion.
 */
export function resolveUploadFilePath(folder, filename) {
  if (!ALLOWED_UPLOAD_FOLDERS.has(folder)) {
    return null;
  }

  if (typeof filename !== "string" || !UPLOAD_FILENAME_PATTERN.test(filename)) {
    return null;
  }

  const resolved = path.resolve(UPLOAD_ROOT, folder, filename);
  if (!resolved.startsWith(`${UPLOAD_ROOT}${path.sep}`)) {
    return null;
  }

  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeType = ext ? MIME_BY_EXT[ext] : null;
  if (!mimeType) {
    return null;
  }

  return { filePath: resolved, mimeType };
}

export async function deleteUploadedImage(imageUrl) {
  if (typeof imageUrl !== "string") {
    return;
  }

  const cleaned = imageUrl.replace(/^\/api(?=\/uploads\/)/, "");
  const match = /^\/uploads\/(products|stores)\/([^/?#]+)$/.exec(cleaned);
  if (!match) {
    return;
  }

  const resolved = resolveUploadFilePath(match[1], match[2]);
  if (!resolved) {
    return;
  }

  try {
    await fs.unlink(resolved.filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}
