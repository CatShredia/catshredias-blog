import { PostStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { WikiLinkTarget } from "@/lib/markdown-wikilink";

export async function listPublishedWikiLinkTargets(): Promise<WikiLinkTarget[]> {
  return prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      publishedAt: { lte: new Date() },
    },
    select: { title: true, slug: true },
    orderBy: { title: "asc" },
  });
}

export async function listAdminWikiLinkTargets(): Promise<WikiLinkTarget[]> {
  return prisma.post.findMany({
    select: { title: true, slug: true },
    orderBy: { title: "asc" },
  });
}
