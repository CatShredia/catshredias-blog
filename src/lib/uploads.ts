import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/flac",
  "audio/x-flac",
]);

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".mpeg",
  ".ogg",
  ".wav",
  ".webm",
  ".m4a",
  ".flac",
]);

export function getUploadDir() {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
}

export function getPublicUploadUrl(filename: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/api/uploads/${filename}`;
}

function isAudioFile(file: File) {
  if (AUDIO_TYPES.has(file.type)) return true;
  const ext = path.extname(file.name).toLowerCase();
  return AUDIO_EXTENSIONS.has(ext);
}

export async function saveUpload(file: File) {
  const isAudio = isAudioFile(file);
  const isImage = IMAGE_TYPES.has(file.type);
  if (!isAudio && !isImage) {
    throw new Error("Недопустимый тип файла");
  }
  const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    throw new Error(
      isAudio
        ? "Аудио слишком большое (макс. 50 МБ)"
        : "Файл слишком большой (макс. 5 МБ)",
    );
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
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/webm": ".webm",
    "audio/mp4": ".m4a",
    "audio/x-m4a": ".m4a",
    "audio/flac": ".flac",
    "audio/x-flac": ".flac",
  };
  return map[mime] ?? "";
}
