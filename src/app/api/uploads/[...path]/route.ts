import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { getUploadDir } from "@/lib/uploads";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".mpeg": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".webm": "audio/webm",
  ".m4a": "audio/mp4",
};

function parseRange(
  rangeHeader: string | null,
  size: number,
): { start: number; end: number } | null {
  if (!rangeHeader?.startsWith("bytes=")) return null;

  const [startStr, endStr] = rangeHeader.replace(/^bytes=/, "").split("-");
  const start = Number.parseInt(startStr, 10);
  if (Number.isNaN(start) || start < 0 || start >= size) return null;

  const end =
    endStr === "" || endStr === undefined
      ? size - 1
      : Number.parseInt(endStr, 10);

  if (Number.isNaN(end) || end < start) return null;

  return { start, end: Math.min(end, size - 1) };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const safeName = path.basename(segments.join("/"));
  if (!safeName || safeName !== segments.join("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const filePath = path.join(getUploadDir(), safeName);
    const buffer = await readFile(filePath);
    const ext = path.extname(safeName).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    const size = buffer.byteLength;

    const baseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    };

    const range = parseRange(request.headers.get("range"), size);

    if (range) {
      const chunk = buffer.subarray(range.start, range.end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          ...baseHeaders,
          "Content-Length": String(chunk.byteLength),
          "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
        },
      });
    }

    return new NextResponse(buffer, {
      headers: {
        ...baseHeaders,
        "Content-Length": String(size),
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
