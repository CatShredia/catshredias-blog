import { NextRequest, NextResponse } from "next/server";

import { resolveSessionDbUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/uploads";

export async function POST(request: NextRequest) {
  const dbUser = await resolveSessionDbUser();
  if (!dbUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
    }

    const saved = await saveUpload(file);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { image: saved.url },
    });

    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
