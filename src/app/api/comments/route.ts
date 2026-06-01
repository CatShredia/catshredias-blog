import { NextRequest, NextResponse } from "next/server";

import { mapCommentAuthor } from "@/lib/deleted-user";
import { resolveSessionDbUser } from "@/lib/auth-helpers";
import { logger } from "@/lib/logger";
import { notifyCommentInstant } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { createComment } from "@/lib/queries/comments";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { commentSchema } from "@/lib/validations/comment";

export async function POST(request: NextRequest) {
  const dbUser = await resolveSessionDbUser();
  if (!dbUser) {
    return NextResponse.json(
      { error: "Войдите или зарегистрируйтесь, чтобы оставить комментарий" },
      { status: 401 },
    );
  }

  const limited = rateLimit(`comments:${dbUser.id}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 },
    );
  }

  try {
    const body = commentSchema.parse(await request.json());

    const turnstileOk = await verifyTurnstile(body.turnstileToken);
    if (!turnstileOk) {
      return NextResponse.json(
        { error: "Проверка Turnstile не пройдена" },
        { status: 400 },
      );
    }

    const post = await prisma.post.findFirst({
      where: { id: body.postId, status: "PUBLISHED" },
    });
    if (!post) {
      return NextResponse.json({ error: "Пост не найден" }, { status: 404 });
    }

    const authorName =
      dbUser.name?.trim() || dbUser.email.split("@")[0];
    const authorEmail = dbUser.email;

    const comment = await createComment({
      postId: body.postId,
      userId: dbUser.id,
      authorName,
      authorEmail,
      content: body.content,
      parentId: body.parentId,
    });

    const author = mapCommentAuthor(comment.user, comment.authorName);

    logger.info("Comment created", {
      commentId: comment.id,
      postId: post.id,
      userId: dbUser.id,
    });

    void notifyCommentInstant(comment.id).catch((err) => {
      logger.error("Comment notification failed", {
        error: err instanceof Error ? err.message : "unknown",
      });
    });

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          authorName: author.authorName,
          authorImage: author.authorImage,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          replies: [],
        },
        message: "Комментарий опубликован",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("жалобу")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (
        error.message.includes("вложенности") ||
        error.message.includes("Родительский")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    logger.error("POST /api/comments failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
