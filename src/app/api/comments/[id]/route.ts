import { NextResponse } from "next/server";

import { resolveSessionDbUser } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";
import { deleteOwnComment } from "@/lib/queries/comments";
import { rateLimit } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const dbUser = await resolveSessionDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { id: commentId } = await context.params;

  const limited = rateLimit(`delete-comment:${dbUser.id}`, 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 },
    );
  }

  try {
    await deleteOwnComment(commentId, dbUser.id);
    logger.info("Comment deleted by author", {
      commentId,
      userId: dbUser.id,
    });
    return NextResponse.json({ message: "Комментарий удалён" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось удалить комментарий";
    const status = message.includes("не найден") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
