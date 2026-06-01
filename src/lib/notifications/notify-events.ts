import type { ContactMessage, Report } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { blogPostPath } from "@/lib/slug";

import { formatInstantCommentTelegram } from "./comment-format";
import { createAdminNotification } from "./create";
import { getNotificationSettings, shouldNotify } from "./settings";

export async function notifyContactMessage(message: ContactMessage) {
  const settings = await getNotificationSettings();
  if (!shouldNotify(settings.contactMode, "contact")) return null;

  return createAdminNotification({
    type: "CONTACT",
    title: "Новое сообщение с формы контактов",
    body: `${message.name} (${message.email}): ${message.message.slice(0, 200)}${message.message.length > 200 ? "…" : ""}`,
    href: `/admin/notifications?highlight=${message.id}`,
    entityId: message.id,
    telegram: true,
  });
}

export async function notifyReport(reportId: string) {
  const settings = await getNotificationSettings();
  if (!shouldNotify(settings.reportMode, "report")) return null;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      comment: {
        include: { post: { select: { title: true, slug: true } } },
      },
      reporter: { select: { name: true, email: true } },
    },
  });

  if (!report) return null;

  const reporter =
    report.reporter?.name ?? report.reporter?.email ?? "Пользователь";

  return createAdminNotification({
    type: "REPORT",
    title: "Жалоба на комментарий",
    body: `${reporter}: ${report.reason.slice(0, 180)}${report.reason.length > 180 ? "…" : ""} · пост «${report.comment.post.title}»`,
    href: "/admin/reports",
    entityId: report.id,
    telegram: true,
  });
}

export async function notifyCommentInstant(commentId: string) {
  const settings = await getNotificationSettings();
  if (!shouldNotify(settings.commentMode, "comment")) return null;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: { select: { title: true, slug: true } } },
  });

  if (!comment) return null;

  const notifyPayload = {
    authorName: comment.authorName,
    content: comment.content,
    post: comment.post,
  };

  return createAdminNotification({
    type: "COMMENT_INSTANT",
    title: `Комментарий к «${comment.post.title}»`,
    body: `${comment.authorName}:\n${comment.content.slice(0, 200)}${comment.content.length > 200 ? "…" : ""}`,
    href: `${blogPostPath(comment.post.slug)}#comments`,
    entityId: comment.id,
    telegram: {
      text: formatInstantCommentTelegram(notifyPayload),
    },
  });
}
