import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { resolveSessionDbUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(80),
});

export async function PATCH(request: NextRequest) {
  const dbUser = await resolveSessionDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await request.json());
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { name: body.name },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
