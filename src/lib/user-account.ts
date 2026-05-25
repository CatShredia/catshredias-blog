import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function softDeleteUserAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, deletedAt: true },
  });

  if (!user) {
    throw new Error("Пользователь не найден");
  }

  if (user.deletedAt) {
    throw new Error("Аккаунт уже удалён");
  }

  if (user.role === Role.ADMIN) {
    throw new Error("Аккаунт администратора нельзя удалить через профиль");
  }

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        name: null,
        image: null,
        passwordHash: null,
      },
    }),
  ]);
}
