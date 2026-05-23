import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { listPublishedPosts } from "@/lib/queries/posts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor") ?? undefined;
    const q = searchParams.get("q") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const tag = searchParams.get("tag") ?? undefined;
    const limit = Math.min(
      Number(searchParams.get("limit") ?? "6") || 6,
      20,
    );

    const result = await listPublishedPosts({
      cursor,
      q,
      categorySlug: category,
      tagSlug: tag,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("GET /api/posts failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
