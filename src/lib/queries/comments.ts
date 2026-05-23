import { CommentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createComment(data: {
  postId: string;
  content: string;
  authorName: string;
  authorEmail: string;
  parentId?: string;
}) {
  return prisma.comment.create({
    data: {
      ...data,
      status: CommentStatus.PENDING,
    },
  });
}

export async function listCommentsForModeration(status?: CommentStatus) {
  return prisma.comment.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      post: { select: { title: true, slug: true } },
    },
    take: 100,
  });
}

export async function updateCommentStatus(
  id: string,
  status: CommentStatus,
) {
  return prisma.comment.update({
    where: { id },
    data: { status },
  });
}

export async function deleteComment(id: string) {
  return prisma.comment.delete({ where: { id } });
}
