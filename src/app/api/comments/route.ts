import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createComment } from "@/lib/queries/comments";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { commentSchema } from "@/lib/validations/comment";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { error: "Войдите или зарегистрируйтесь, чтобы оставить комментарий" },
      { status: 401 },
    );
  }

  const limited = rateLimit(`comments:${session.user.id}`, 10, 60_000);
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
      session.user.name?.trim() || session.user.email.split("@")[0];
    const authorEmail = session.user.email;

    const comment = await createComment({
      postId: body.postId,
      userId: session.user.id,
      authorName,
      authorEmail,
      content: body.content,
      parentId: body.parentId,
    });

    logger.info("Comment created", {
      commentId: comment.id,
      postId: post.id,
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          authorName: comment.user?.name ?? comment.authorName,
          authorImage: comment.user?.image,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          replies: [],
        },
        message: "Комментарий опубликован",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("жалобу")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
