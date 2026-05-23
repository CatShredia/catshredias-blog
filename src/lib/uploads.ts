import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const MAX_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export function getUploadDir() {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

export function getPublicUploadUrl(filename: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/api/uploads/${filename}`;
}

export async function saveUpload(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Недопустимый тип файла");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Файл слишком большой (макс. 5 МБ)");
  }

  const ext = path.extname(file.name) || mimeToExt(file.type);
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const dir = getUploadDir();
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return {
    filename,
    url: `/api/uploads/${filename}`,
  };
}

function mimeToExt(mime: string) {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
  };
  return map[mime] ?? "";
}
