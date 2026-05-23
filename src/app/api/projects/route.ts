import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { listProjects } from "@/lib/queries/projects";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const tech = searchParams.get("tech") ?? undefined;
    const role = searchParams.get("role") ?? undefined;

    const items = await listProjects({ tech, role });
    return NextResponse.json({ items });
  } catch (error) {
    logger.error("GET /api/projects failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
