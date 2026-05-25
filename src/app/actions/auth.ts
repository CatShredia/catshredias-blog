"use server";

import { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const registerSchema = z
  .object({
    name: z.string().min(2, "Имя: минимум 2 символа").max(80),
    email: z.string().email("Некорректный email"),
    password: z.string().min(8, "Пароль: минимум 8 символов"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function registerUser(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").toLowerCase();

  const limited = rateLimit(`register:${email}`, 3, 60 * 60 * 1000);
  if (!limited.ok) {
    return { error: "Слишком много попыток. Попробуйте позже." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) {
    return { error: "Пользователь с таким email уже зарегистрирован. Если вы хотите зарегистировать аккаунт на почту с удаленного аккаунта, напишите мне на почту catshredia.990@gmail.com" };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hash(parsed.data.password, 12),
      role: Role.USER,
    },
  });

  redirect("/login?registered=1");
}
