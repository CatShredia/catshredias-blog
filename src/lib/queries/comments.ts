import { CommentStatus, ReportStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createComment(data: {
  postId: string;
  content: string;
  authorName: string;
  authorEmail: string;
  userId?: string;
  parentId?: string;
}) {
  return prisma.comment.create({
    data: {
      ...data,
      status: CommentStatus.APPROVED,
      adminSeenAt: null,
    },
    include: {
      user: { select: { name: true, image: true } },
    },
  });
}

export async function listApprovedComments(postId: string) {
  return prisma.comment.findMany({
    where: {
      postId,
      status: CommentStatus.APPROVED,
      parentId: null,
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, image: true } },
      replies: {
        where: { status: CommentStatus.APPROVED },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });
}

export async function listAdminComments() {
  return prisma.comment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      post: { select: { title: true, slug: true } },
      user: { select: { name: true, email: true } },
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
