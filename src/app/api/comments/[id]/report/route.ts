import { NextRequest, NextResponse } from "next/server";

import { resolveSessionDbUser } from "@/lib/auth-helpers";
import { createReport } from "@/lib/queries/comments";
import { rateLimit } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/validations/comment";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const dbUser = await resolveSessionDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { id: commentId } = await context.params;

  const limited = rateLimit(`report:${dbUser.id}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Слишком много жалоб" }, { status: 429 });
  }

  try {
    const body = reportSchema.parse(await request.json());
    await createReport({
      commentId,
      reporterId: dbUser.id,
      reason: body.reason,
    });
    return NextResponse.json({ message: "Жалоба отправлена администратору" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка" },
      { status: 400 },
    );
  }
}
