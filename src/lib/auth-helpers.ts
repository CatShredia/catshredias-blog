import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function isAdminRole(role: string | undefined) {
  return role === Role.ADMIN;
}

export type SessionDbUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
};

export async function resolveSessionDbUser(): Promise<SessionDbUser | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { id: true, email: true, name: true, image: true, role: true },
  });

  return dbUser;
}
