import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { logger } from "@/lib/logger";
import { notifyContactMessage } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";
import { contactSchema } from "@/lib/validations/contact";

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);

  const ipLimited = rateLimit(`contact:ip:${ip}`, 5, 60 * 60 * 1000);
  if (!ipLimited.ok) {
    return NextResponse.json(
      { error: "Слишком много сообщений. Попробуйте позже." },
      { status: 429 },
    );
  }

  try {
    const body = contactSchema.parse(await request.json());
    const email = body.email.toLowerCase();

    const emailLimited = rateLimit(`contact:email:${email}`, 3, 60 * 60 * 1000);
    if (!emailLimited.ok) {
      return NextResponse.json(
        { error: "С этого email уже отправляли недавно. Подождите немного." },
        { status: 429 },
      );
    }

    const message = await prisma.contactMessage.create({
      data: {
        name: body.name,
        email,
        message: body.message,
        ip: ip === "unknown" ? null : ip,
      },
    });

    logger.info("Contact message received", {
      id: message.id,
      email,
    });

    void notifyContactMessage(message).catch((err) => {
      logger.error("Contact notification failed", {
        error: err instanceof Error ? err.message : "unknown",
      });
    });

    return NextResponse.json(
      { message: "Сообщение отправлено. Ответим на указанный email." },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0]?.message ?? "Некорректные данные";
      return NextResponse.json({ error: first }, { status: 400 });
    }
    logger.error("POST /api/contacts failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Не удалось отправить сообщение" },
      { status: 500 },
    );
  }
}
