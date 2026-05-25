import { NextResponse } from "next/server";

import { resolveSessionDbUser } from "@/lib/auth-helpers";
import { softDeleteUserAccount } from "@/lib/user-account";

export async function DELETE() {
  const dbUser = await resolveSessionDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  try {
    await softDeleteUserAccount(dbUser.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Не удалось удалить аккаунт",
      },
      { status: 400 },
    );
  }
}
