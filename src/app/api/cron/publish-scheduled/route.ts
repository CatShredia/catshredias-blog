import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { publishScheduledPosts } from "@/lib/queries/posts";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await publishScheduledPosts();
  logger.info("Scheduled posts published", { count });

  return NextResponse.json({ published: count });
}
