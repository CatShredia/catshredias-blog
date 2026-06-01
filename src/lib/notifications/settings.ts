import type { AdminNotificationSettings, NotifyMode } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default";

export type NotificationSettings = AdminNotificationSettings & {
  effectiveTelegramChatId: string | null;
  effectiveTelegramEnabled: boolean;
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const row = await prisma.adminNotificationSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {},
  });

  const envChatId = process.env.TELEGRAM_CHAT_ID?.trim() || null;
  const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
  const chatId = row.telegramChatId?.trim() || envChatId;
  const hasToken = Boolean(envToken);
  const effectiveTelegramEnabled = row.telegramEnabled && hasToken && Boolean(chatId);

  return {
    ...row,
    effectiveTelegramChatId: chatId,
    effectiveTelegramEnabled,
  };
}

export async function updateNotificationSettings(data: {
  contactMode: NotifyMode;
  reportMode: NotifyMode;
  commentMode: NotifyMode;
  telegramEnabled: boolean;
  telegramChatId?: string;
  telegramContact: boolean;
  telegramReport: boolean;
  telegramComments: boolean;
}) {
  return prisma.adminNotificationSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      ...data,
      telegramChatId: data.telegramChatId?.trim() || null,
    },
    update: {
      ...data,
      telegramChatId: data.telegramChatId?.trim() || null,
    },
  });
}

export function shouldNotify(
  mode: NotifyMode,
  type: "contact" | "report" | "comment",
): boolean {
  if (mode === "OFF") return false;
  if (type === "contact" || type === "report") {
    return mode === "INSTANT";
  }
  return mode === "INSTANT";
}

export function shouldDigestComments(mode: NotifyMode): boolean {
  return mode === "DAILY" || mode === "WEEKLY";
}
