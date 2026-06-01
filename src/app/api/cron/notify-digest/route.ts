import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { runCommentDigest } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodParam = request.nextUrl.searchParams.get("period");
  const period = periodParam === "daily" ? "daily" : "weekly";

  const result = await runCommentDigest(period);
  logger.info("Comment digest cron", { period, ...result });

  return NextResponse.json({ period, ...result });
}
