import { CommentStatus, ReportStatus } from "@prisma/client";

import {
  buildCommentTree,
  canReplyToDepth,
  getCommentDepth,
  MAX_COMMENT_DEPTH,
} from "@/lib/comments-tree";
import { mapCommentAuthor } from "@/lib/deleted-user";
import { prisma } from "@/lib/prisma";

function mapCommentRow(comment: {
  id: string;
  parentId: string | null;
  authorName: string;
  content: string;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
    deletedAt: Date | null;
  } | null;
}) {
  const author = mapCommentAuthor(comment.user, comment.authorName);
  return {
    id: comment.id,
    parentId: comment.parentId,
    authorName: author.authorName,
    authorImage: author.authorImage,
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

export async function validateCommentParent(postId: string, parentId?: string) {
  if (!parentId) return;

  const parent = await prisma.comment.findFirst({
    where: { id: parentId, postId, status: CommentStatus.APPROVED },
    select: { id: true, parentId: true },
  });

  if (!parent) {
    throw new Error("Родительский комментарий не найден");
  }

  const chain = await prisma.comment.findMany({
    where: { postId, status: CommentStatus.APPROVED },
    select: { id: true, parentId: true },
  });

  const parentById = new Map(chain.map((row) => [row.id, row.parentId]));
  const parentDepth = getCommentDepth(parent.id, parentById);

  if (!canReplyToDepth(parentDepth)) {
    throw new Error(
      `Достигнут максимальный уровень вложенности ответов (${MAX_COMMENT_DEPTH})`,
    );
  }
}

export async function createComment(data: {
  postId: string;
  content: string;
  authorName: string;
  authorEmail: string;
  userId?: string;
  parentId?: string;
}) {
  await validateCommentParent(data.postId, data.parentId);

  return prisma.comment.create({
    data: {
      ...data,
      status: CommentStatus.APPROVED,
      adminSeenAt: null,
    },
    include: {
      user: { select: { name: true, image: true, deletedAt: true } },
    },
  });
}

export async function listApprovedComments(postId: string) {
  const rows = await prisma.comment.findMany({
    where: { postId, status: CommentStatus.APPROVED },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, image: true, deletedAt: true } } },
  });

  return buildCommentTree(rows.map(mapCommentRow));
}

export async function listAdminComments() {
  return prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      post: { select: { title: true, slug: true } },
      user: { select: { name: true, email: true, deletedAt: true } },
      _count: { select: { reports: { where: { status: ReportStatus.PENDING } } } },
    },
    take: 200,
  });
}

export async function countUnseenComments() {
  return prisma.comment.count({
    where: { adminSeenAt: null, status: CommentStatus.APPROVED },
  });
}

export async function markAllCommentsSeen() {
  return prisma.comment.updateMany({
    where: { adminSeenAt: null },
    data: { adminSeenAt: new Date() },
  });
}

export async function markCommentSeen(id: string) {
  return prisma.comment.update({
    where: { id },
    data: { adminSeenAt: new Date() },
  });
}

export async function createReport(data: {
  commentId: string;
  reporterId: string;
  reason: string;
}) {
  const existing = await prisma.report.findFirst({
    where: {
      commentId: data.commentId,
      reporterId: data.reporterId,
      status: ReportStatus.PENDING,
    },
  });
  if (existing) {
    throw new Error("Вы уже отправили жалобу на этот комментарий");
  }

  return prisma.report.create({ data });
}

export async function listReports(status?: ReportStatus) {
  return prisma.report.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      comment: {
        include: {
          post: { select: { title: true, slug: true } },
          user: { select: { name: true, email: true } },
        },
      },
      reporter: { select: { name: true, email: true } },
    },
    take: 100,
  });
}

export async function countPendingReports() {
  return prisma.report.count({ where: { status: ReportStatus.PENDING } });
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  adminNote?: string,
) {
  return prisma.report.update({
    where: { id },
    data: {
      status,
      adminNote,
      reviewedAt: new Date(),
    },
  });
}

export async function deleteComment(id: string) {
  return prisma.comment.delete({ where: { id } });
}

export async function hideComment(id: string) {
  return prisma.comment.update({
    where: { id },
    data: { status: CommentStatus.REJECTED },
  });
}
