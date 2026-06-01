import { CommentStatus, NotifyMode } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/seo";

import { createAdminNotification } from "./create";
import { getNotificationSettings } from "./settings";

const DIGEST_STATE_ID = "default";

type DigestPeriod = "daily" | "weekly";

function periodMs(period: DigestPeriod) {
  return period === "daily" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
}

function expectedMode(period: DigestPeriod): NotifyMode {
  return period === "daily" ? NotifyMode.DAILY : NotifyMode.WEEKLY;
}

export async function runCommentDigest(period: DigestPeriod) {
  const settings = await getNotificationSettings();
  const mode = expectedMode(period);

  if (settings.commentMode !== mode) {
    return { skipped: true, reason: "comment_mode_mismatch", count: 0 };
  }

  const state = await prisma.notificationDigestState.upsert({
    where: { id: DIGEST_STATE_ID },
    create: { id: DIGEST_STATE_ID },
    update: {},
  });

  const lastField =
    period === "daily" ? state.lastDailyDigestAt : state.lastWeeklyDigestAt;
  const since = lastField ?? new Date(Date.now() - periodMs(period));

  const comments = await prisma.comment.findMany({
    where: {
      status: CommentStatus.APPROVED,
      adminSeenAt: null,
      createdAt: { gte: since },
    },
    include: { post: { select: { title: true, slug: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (comments.length === 0) {
    return { skipped: false, count: 0 };
  }

  const periodLabel = period === "daily" ? "за сутки" : "за неделю";
  const preview = comments
    .slice(0, 3)
    .map((c) => `• ${c.authorName} — «${c.post.title}»`)
    .join("\n");
  const more =
    comments.length > 3 ? `\n…и ещё ${comments.length - 3}` : "";

  await createAdminNotification({
    type: "COMMENT_DIGEST",
    title: `Новые комментарии (${comments.length})`,
    body: `${comments.length} непросмотренных ${periodLabel}:\n${preview}${more}`,
    href: "/admin/comments",
    telegram: {
      text: `Комментарии (${comments.length}) ${periodLabel}\n${preview}${more}\n\n${siteUrl}/admin/comments`,
    },
  });

  const now = new Date();
  await prisma.notificationDigestState.update({
    where: { id: DIGEST_STATE_ID },
    data:
      period === "daily"
        ? { lastDailyDigestAt: now }
        : { lastWeeklyDigestAt: now },
  });

  return { skipped: false, count: comments.length, period };
}
