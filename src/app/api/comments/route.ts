import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createComment } from "@/lib/queries/comments";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const commentSchema = z.object({
  postId: z.string().min(1),
  authorName: z.string().min(2).max(80),
  authorEmail: z.string().email(),
  content: z.string().min(3).max(5000),
  parentId: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const limited = rateLimit(`comments:${ip}`, 5, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limited.retryAfterMs ?? 60_000) / 1000)),
        },
      },
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

    const comment = await createComment({
      postId: body.postId,
      authorName: body.authorName,
      authorEmail: body.authorEmail,
      content: body.content,
      parentId: body.parentId,
    });

    logger.info("Comment created", { commentId: comment.id, postId: post.id });

    return NextResponse.json(
      {
        id: comment.id,
        message: "Комментарий отправлен на модерацию",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Некорректные данные", details: error.flatten() },
        { status: 400 },
      );
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
