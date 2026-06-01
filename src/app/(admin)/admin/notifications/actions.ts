"use server";

import { NotifyMode } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-auth";
import {
  getNotificationSettings,
  markAllNotificationsRead,
  markNotificationRead,
  runCommentDigest,
  shouldDigestComments,
  updateNotificationSettings,
} from "@/lib/notifications";

const settingsSchema = z.object({
  contactMode: z.nativeEnum(NotifyMode),
  reportMode: z.nativeEnum(NotifyMode),
  commentMode: z.nativeEnum(NotifyMode),
  telegramEnabled: z.enum(["on"]).optional(),
  telegramChatId: z.string().optional(),
  telegramContact: z.enum(["on"]).optional(),
  telegramReport: z.enum(["on"]).optional(),
  telegramComments: z.enum(["on"]).optional(),
});

export async function markNotificationReadAction(id: string) {
  await requireAdmin();
  await markNotificationRead(id);
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}

export async function markAllNotificationsReadAction() {
  await requireAdmin();
  await markAllNotificationsRead();
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}

export async function updateNotificationSettingsAction(formData: FormData) {
  await requireAdmin();

  const parsed = settingsSchema.parse({
    contactMode: formData.get("contactMode"),
    reportMode: formData.get("reportMode"),
    commentMode: formData.get("commentMode"),
    telegramEnabled: formData.get("telegramEnabled") ?? undefined,
    telegramChatId: formData.get("telegramChatId") || undefined,
    telegramContact: formData.get("telegramContact") ?? undefined,
    telegramReport: formData.get("telegramReport") ?? undefined,
    telegramComments: formData.get("telegramComments") ?? undefined,
  });

  await updateNotificationSettings({
    contactMode: parsed.contactMode,
    reportMode: parsed.reportMode,
    commentMode: parsed.commentMode,
    telegramEnabled: parsed.telegramEnabled === "on",
    telegramChatId: parsed.telegramChatId,
    telegramContact: parsed.telegramContact === "on",
    telegramReport: parsed.telegramReport === "on",
    telegramComments: parsed.telegramComments === "on",
  });

  revalidatePath("/admin/notifications");
}

/** Ручной дайджест комментариев (для режима «раз в сутки/неделю», без cron). */
export async function runCommentDigestNowAction() {
  await requireAdmin();
  const settings = await getNotificationSettings();

  if (!shouldDigestComments(settings.commentMode)) {
    throw new Error(
      "Дайджест доступен только при режиме комментариев «раз в сутки» или «раз в неделю»",
    );
  }

  const period =
    settings.commentMode === NotifyMode.DAILY ? "daily" : "weekly";
  await runCommentDigest(period);
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}
