import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listAdminWikiLinkTargets } from "@/lib/queries/wiki-link-targets";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const targets = await listAdminWikiLinkTargets();

  const filtered = query
    ? targets.filter(
        (target) =>
          target.title.toLowerCase().includes(query) ||
          target.slug.toLowerCase().includes(query),
      )
    : targets;

  return NextResponse.json(filtered.slice(0, 50));
}
