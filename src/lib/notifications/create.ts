import type { AdminNotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/seo";

import { logger } from "@/lib/logger";

import { getNotificationSettings } from "./settings";
import { sendTelegramMessageAsync } from "./telegram";

export type CreateNotificationInput = {
  type: AdminNotificationType;
  title: string;
  body: string;
  href: string;
  entityId?: string;
  telegram?:
    | boolean
    | {
        enabled?: boolean;
        text?: string;
      };
};

function absoluteHref(href: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  return `${siteUrl}${href.startsWith("/") ? href : `/${href}`}`;
}

export async function createAdminNotification(input: CreateNotificationInput) {
  const notification = await prisma.adminNotification.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
      entityId: input.entityId,
    },
  });

  const settings = await getNotificationSettings();
  const wantTelegram =
    input.telegram === true ||
    (typeof input.telegram === "object" && input.telegram?.enabled !== false);

  if (!wantTelegram) {
    return notification;
  }

  if (!settings.effectiveTelegramEnabled) {
    logger.info("Telegram skipped: disabled in settings or missing TELEGRAM_* in env", {
      type: input.type,
      telegramEnabled: settings.telegramEnabled,
      hasEnvToken: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()),
      hasChatId: Boolean(settings.effectiveTelegramChatId),
    });
    return notification;
  }

  const typeFlag =
    input.type === "CONTACT"
      ? settings.telegramContact
      : input.type === "REPORT"
        ? settings.telegramReport
        : settings.telegramComments;

  if (!typeFlag || !settings.effectiveTelegramChatId) {
    logger.info("Telegram skipped: type disabled or no chat id", {
      type: input.type,
      typeFlag,
      chatId: settings.effectiveTelegramChatId,
    });
    return notification;
  }

  const text =
    (typeof input.telegram === "object" && input.telegram.text) ||
    `${input.title}\n\n${input.body}\n\n${absoluteHref(input.href)}`;

  sendTelegramMessageAsync({
    chatId: settings.effectiveTelegramChatId,
    text,
  });

  return notification;
}

export async function countUnreadNotifications() {
  return prisma.adminNotification.count({
    where: { readAt: null },
  });
}

export async function listNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
}) {
  return prisma.adminNotification.findMany({
    where: options?.unreadOnly ? { readAt: null } : undefined,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  });
}

export async function markNotificationRead(id: string) {
  const notification = await prisma.adminNotification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  if (notification.type === "CONTACT" && notification.entityId) {
    await prisma.contactMessage.updateMany({
      where: { id: notification.entityId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return notification;
}

export async function markAllNotificationsRead() {
  await prisma.adminNotification.updateMany({
    where: { readAt: null },
    data: { readAt: new Date() },
  });
}
