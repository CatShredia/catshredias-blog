"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth-helpers";
import { updateSiteSettings } from "@/lib/queries/site-settings";
import { siteSettingsSchema } from "@/lib/validations/site-settings";

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function savePortfolioSettingsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    return { error: "Недостаточно прав" };
  }

  const parsed = siteSettingsSchema.safeParse({
    hhUrl: formData.get("hhUrl") || "",
    resumePdf: formData.get("resumePdf") || "",
    lookingForWork: formData.get("lookingForWork") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Некорректные данные" };
  }

  await updateSiteSettings({
    hhUrl: emptyToNull(parsed.data.hhUrl),
    resumePdf: emptyToNull(parsed.data.resumePdf),
    lookingForWork: parsed.data.lookingForWork,
  });

  revalidatePath("/portfolio");
  revalidatePath("/admin/portfolio-settings");

  return { ok: true as const };
}
